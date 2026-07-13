import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generarContenidoSesion } from "@/lib/anthropic/sesion";
import { formatearContexto, searchRag } from "@/lib/rag";
import { supabaseAdmin } from "@/lib/supabase/admin";

const bodySchema = z.object({
  tema: z.string().min(2).max(200),
  bloque: z.string().min(2).max(100),
  tipo_sesion: z.enum(["lectura", "repaso", "examen"]),
});

function cacheKey(tema: string, tipo: string): string {
  const slug = tema
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-");
  return `${slug}:${tipo}`;
}

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: "Body inválido" }, { status: 400 });
  }
  const { tema, bloque, tipo_sesion } = parsed.data;
  const sb = supabaseAdmin();
  const key = cacheKey(tema, tipo_sesion);

  // cache: si la tabla no existe aún (migración 0002 pendiente) se genera igual
  let cacheado: { contenido: Record<string, unknown>; tema_id: string | null } | null = null;
  try {
    const r = await sb.from("sesion_cache").select("contenido, tema_id").eq("cache_key", key).maybeSingle();
    cacheado = r.data;
  } catch {
    cacheado = null;
  }

  // tema_id real si el seed del temario ya corrió
  let temaRow: { id: string; bloque_id: string | null } | null = null;
  try {
    const r = await sb.from("temas").select("id, bloque_id").ilike("titulo", `%${tema}%`).limit(1).maybeSingle();
    temaRow = r.data;
  } catch {
    temaRow = null;
  }

  if (cacheado) {
    return NextResponse.json({
      data: { contenido: cacheado.contenido, tema_id: temaRow?.id ?? cacheado.tema_id, cache: true },
      error: null,
    });
  }

  try {
    // filtra por bloque; si el bloque es grueso (p.ej. "Parte Específica")
    // y no casa con el bloque_oir fino de los chunks, cae a todo el corpus
    let chunks = await searchRag(`${tema} ${bloque}`, bloque, 8);
    if (chunks.length < 3) {
      chunks = await searchRag(`${tema} ${bloque}`, null, 8);
    }
    const contexto = formatearContexto(chunks);
    const contenido = await generarContenidoSesion(tipo_sesion, tema, bloque, contexto);

    // guardar en cache es best-effort
    try {
      await sb.from("sesion_cache").insert({
        cache_key: key,
        tema_id: temaRow?.id ?? null,
        bloque,
        tipo: tipo_sesion,
        contenido: contenido as unknown as Record<string, unknown>,
      });
    } catch {
      // sin cache: la próxima petición regenera
    }

    return NextResponse.json({
      data: {
        contenido,
        tema_id: temaRow?.id ?? null,
        bloque_id: temaRow?.bloque_id ?? null,
        rag_chunks: chunks.length,
        cache: false,
      },
      error: null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error generando contenido";
    return NextResponse.json({ data: null, error: msg }, { status: 502 });
  }
}
