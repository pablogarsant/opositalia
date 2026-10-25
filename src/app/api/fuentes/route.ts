import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

const idsSchema = z.array(z.string().uuid()).min(1).max(20);

export interface FragmentoFuente {
  id: string;
  documento: string;
  capitulo: string | null;
  // rango del tramo ingestado (capítulo o bloque de 40 páginas), no la página exacta
  paginas: [number, number] | null;
  traducido: boolean;
  contenido: string;
}

/**
 * Texto literal de chunks_rag (sin pasar por la IA) para el visor de fuentes.
 * GET /api/fuentes?ids=<uuid>,<uuid>
 */
export async function GET(req: NextRequest) {
  // el middleware ya protege /api, pero el corpus no se sirve sin sesión
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });

  const ids = idsSchema.safeParse((req.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean));
  if (!ids.success) {
    return NextResponse.json({ data: null, error: "ids: entre 1 y 20 uuid separados por comas" }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const chunks = await sb.from("chunks_rag").select("id, documento_id, contenido, metadata").in("id", ids.data);
  if (chunks.error) {
    return NextResponse.json({ data: null, error: `chunks_rag: ${chunks.error.message}` }, { status: 500 });
  }
  if (!chunks.data.length) {
    return NextResponse.json({ data: null, error: `Ningún chunk con ids=${ids.data.join(",")}` }, { status: 404 });
  }

  const docIds = [...new Set(chunks.data.map((c) => c.documento_id).filter((d): d is string => !!d))];
  const docs = await sb.from("documentos").select("id, titulo").in("id", docIds);
  if (docs.error) console.error("documentos para el visor:", docs.error.message);
  const tituloDoc = new Map((docs.data ?? []).map((d) => [d.id, d.titulo]));

  // mismo orden que pidió el cliente (es el orden de lectura)
  const porId = new Map(chunks.data.map((c) => [c.id, c]));
  const data: FragmentoFuente[] = ids.data.flatMap((id) => {
    const c = porId.get(id);
    if (!c) return [];
    const m = c.metadata as { libro?: string; capitulo_titulo?: string; paginas?: number[]; traducido?: boolean };
    return [
      {
        id: c.id,
        documento: (c.documento_id && tituloDoc.get(c.documento_id)) || m.libro || "Documento sin título",
        capitulo: m.capitulo_titulo ?? null,
        paginas: Array.isArray(m.paginas) && m.paginas.length === 2 ? [m.paginas[0], m.paginas[1]] : null,
        traducido: m.traducido === true,
        contenido: c.contenido,
      },
    ];
  });

  return NextResponse.json({ data, error: null });
}
