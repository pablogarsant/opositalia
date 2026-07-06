import { supabaseAdmin } from "@/lib/supabase/admin";

export interface ChunkRAG {
  contenido: string;
  metadata: Record<string, unknown>;
  score: number;
}

/**
 * Búsqueda semántica en chunks_rag (equivalente TS de scripts/rag/search.py).
 * Solo servidor: usa el cliente admin y la OPENAI_API_KEY.
 */
export async function searchRag(
  query: string,
  bloque?: string | null,
  limit = 5
): Promise<ChunkRAG[]> {
  const embedding = await embedQuery(query);
  const { data, error } = await supabaseAdmin().rpc("search_chunks", {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: limit,
    filter_bloque: bloque ?? null,
  });
  if (error) throw new Error(`search_chunks: ${error.message}`);
  return (data ?? []).map((r) => ({
    contenido: r.contenido,
    metadata: r.metadata,
    score: r.similarity,
  }));
}

// fetch directo a OpenAI: una llamada simple no justifica el SDK como dependencia
async function embedQuery(texto: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: texto }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Error(`OpenAI embeddings ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data[0].embedding;
}

/** Formatea chunks como contexto para prompts de Claude. */
export function formatearContexto(chunks: ChunkRAG[]): string {
  if (!chunks.length) return "";
  return chunks
    .map((c, i) => {
      const cap = c.metadata.capitulo_titulo ?? c.metadata.libro ?? "fuente";
      return `[Fragmento ${i + 1} — ${cap}]\n${c.contenido}`;
    })
    .join("\n\n");
}
