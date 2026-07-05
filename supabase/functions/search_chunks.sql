-- Búsqueda semántica sobre chunks_rag (pgvector, cosine).
-- Ejecutar en el SQL Editor de Supabase.

create or replace function search_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5,
  filter_bloque text default null
)
returns table (
  id uuid,
  contenido text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    id,
    contenido,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  from chunks_rag
  where
    (filter_bloque is null or metadata->>'bloque_oir' = filter_bloque)
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
