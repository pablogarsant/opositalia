import { supabaseAdmin } from "@/lib/supabase/admin";

export interface ChunkRAG {
  id?: string;
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
    id: r.id,
    contenido: r.contenido,
    metadata: r.metadata,
    score: r.similarity,
  }));
}

/**
 * Material para una lectura extensa: hasta `total` chunks (mínimo `minimo`),
 * como mucho `cupo` por documento para no traer 16 del mismo libro, y en el
 * orden real: documento más relevante primero y, dentro, por chunk_index.
 * Sin filtro de bloque: los bloques gruesos del temario no casan con el
 * bloque_oir fino de los chunks (medición Fase 8).
 */
export async function buscarParaLectura(
  consulta: string,
  total = 16,
  minimo = 12,
  cupo = 3
): Promise<ChunkRAG[]> {
  const encontrados = await searchRag(consulta, null, total * 3);
  if (!encontrados.length) throw new Error(`search_chunks sin resultados para "${consulta.slice(0, 80)}"`);
  // ponytail: corte fijo de 0,15 bajo el mejor score. Sin él, el cupo rellena con
  // documentos ajenos cuando un solo documento cubre el tema (medido: Glaucoma en
  // un punto de la Constitución). Ajustar si se queda corto en temas transversales.
  const candidatos = encontrados.filter((c) => c.score >= encontrados[0].score - 0.15);

  // el máster comparte metadata.libro entre PDFs: el documento real es documento_id
  const docs = await supabaseAdmin()
    .from("chunks_rag")
    .select("id, documento_id")
    .in(
      "id",
      candidatos.map((c) => c.id!)
    );
  if (docs.error) throw new Error(`chunks_rag documento_id: ${docs.error.message}`);
  const docDe = new Map(docs.data.map((d) => [d.id, d.documento_id ?? d.id]));
  const doc = (c: ChunkRAG) => docDe.get(c.id!) ?? c.id!;

  // vienen por score: el cupo se queda con los mejores de cada documento
  const usados = new Map<string, number>();
  const dentro: ChunkRAG[] = [];
  const fuera: ChunkRAG[] = [];
  for (const c of candidatos) {
    const n = usados.get(doc(c)) ?? 0;
    usados.set(doc(c), n + 1);
    (n < cupo ? dentro : fuera).push(c);
  }
  // pocos documentos relevantes: se completa hasta el mínimo con los mejores sobrantes
  const elegidos = dentro.length >= minimo ? dentro.slice(0, total) : [...dentro, ...fuera].slice(0, minimo);

  // orden de lectura: documentos por su mejor chunk (primera aparición), dentro por posición
  const rango = new Map<string, number>();
  for (const c of elegidos) if (!rango.has(doc(c))) rango.set(doc(c), rango.size);
  const posicion = (c: ChunkRAG) => Number(c.metadata.chunk_index ?? 0);
  return elegidos.sort((a, b) => rango.get(doc(a))! - rango.get(doc(b))! || posicion(a) - posicion(b));
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
