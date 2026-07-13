import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchRag } from "@/lib/rag";

const schema = z.object({
  titulo: z.string().min(2).max(200),
  bloque: z.string().max(100).nullish(),
});

/** Contenido RAG en crudo de un punto del temario (para el modal "Ver en el temario"). */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: "Body inválido" }, { status: 400 });
  }
  const { titulo, bloque } = parsed.data;

  try {
    let chunks = await searchRag(titulo, bloque ?? null, 3);
    if (chunks.length === 0 && bloque) chunks = await searchRag(titulo, null, 3);
    const fragmentos = chunks.map((c) => ({
      texto: c.contenido.slice(0, 900),
      fuente: (c.metadata as { libro?: string; capitulo_titulo?: string }).capitulo_titulo
        ? `Kanski — ${(c.metadata as { capitulo_titulo?: string }).capitulo_titulo}`
        : ((c.metadata as { libro?: string }).libro ?? "Fuente del temario"),
      score: c.score,
    }));
    return NextResponse.json({ data: { fragmentos }, error: null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error buscando contenido";
    return NextResponse.json({ data: null, error: msg }, { status: 502 });
  }
}
