import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchRag } from "@/lib/rag";
import { formatearContenido, fuentesDeChunks, necesitaIA } from "@/lib/contenido/formatear";
import { reformatearMarkdown } from "@/lib/anthropic/reformatear";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const maxDuration = 60;

const schema = z.object({
  punto_id: z.string().uuid(),
  subtema_id: z.string().uuid().nullish(),
  titulo: z.string().min(2).max(300),
  contexto: z.string().max(300).nullish(), // título del subtema/tema, afina la búsqueda
  bloque: z.string().max(100).nullish(),
  keywords: z.array(z.string().max(80)).max(20).default([]),
});

/**
 * Markdown legible de un punto del temario para la vista libro.
 * Caché en Supabase (contenido_formateado): la primera lectura paga la
 * búsqueda RAG y, si hace falta, el reformateo con Claude; el resto es un select.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: "Body inválido" }, { status: 400 });
  }
  const { punto_id, subtema_id, titulo, contexto, bloque, keywords } = parsed.data;
  const sb = supabaseAdmin();

  const cache = await sb
    .from("contenido_formateado")
    .select("contenido_md, fuentes")
    .eq("punto_id", punto_id)
    .maybeSingle();
  if (cache.data) {
    return NextResponse.json({
      data: { contenido_md: cache.data.contenido_md, fuentes: cache.data.fuentes ?? [], cacheado: true },
      error: null,
    });
  }

  try {
    const consulta = [titulo, contexto, ...keywords].filter(Boolean).join(" · ");
    let chunks = await searchRag(consulta, bloque ?? null, 8);
    if (chunks.length === 0 && bloque) chunks = await searchRag(consulta, null, 8);
    if (chunks.length === 0) {
      return NextResponse.json({
        data: { contenido_md: "", fuentes: [], cacheado: false },
        error: null,
      });
    }

    let md = formatearContenido(chunks);
    const fuentes = fuentesDeChunks(chunks);
    let conIA = false;
    if (necesitaIA(md)) {
      // el limpiador determinista no ha podido: se paga Claude una vez y se cachea
      md = await reformatearMarkdown(md, titulo).catch(() => md);
      conIA = true;
    }

    // ignora el error de escritura: servir el contenido importa más que cachearlo
    await sb
      .from("contenido_formateado")
      .upsert(
        { punto_id, subtema_id: subtema_id ?? null, contenido_md: md, fuentes },
        { onConflict: "punto_id" }
      );

    return NextResponse.json({ data: { contenido_md: md, fuentes, cacheado: false, con_ia: conIA }, error: null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error preparando el contenido";
    return NextResponse.json({ data: null, error: msg }, { status: 502 });
  }
}
