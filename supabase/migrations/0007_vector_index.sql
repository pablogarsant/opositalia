-- Migración 0007 — Índice vectorial para search_chunks
-- Sin índice, cada búsqueda RAG hace un seq scan sobre 22k+ vectores de 1536
-- dims → 'canceling statement due to statement timeout'. El ivfflat de
-- schema.sql nunca se aplicó al recrear el proyecto Supabase.
--
-- ivfflat (no HNSW): HNSW monohilo tarda más que el timeout HTTP del SQL Editor,
-- y en paralelo pide una shared memory que no cabe en el tier. ivfflat se
-- construye en segundos (k-means sobre muestra) y a 22k filas da recall de sobra.
-- Se construye AHORA sobre la tabla ya llena (el ivfflat solo falla si se crea
-- vacío). Con lists=100, probes=10 examina ~10% de las listas: buen recall/latencia.
--
-- Ejecutar en el SQL Editor de Supabase.

set max_parallel_maintenance_workers = 0;
set maintenance_work_mem = '128MB';

create index if not exists idx_chunks_rag_embedding_ivf
  on public.chunks_rag using ivfflat (embedding vector_cosine_ops) with (lists = 100);

drop index if exists public.chunks_rag_embedding_idx;

-- search_chunks pasa a plpgsql solo para fijar probes=10 en cada llamada
-- (ivfflat.probes por defecto es 1 → recall pobre con lists=100).
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
language plpgsql volatile
as $$
begin
  -- volatile (no stable): Postgres solo permite SET dentro de funciones volatile
  set local ivfflat.probes = 10;
  -- Dos claves para que ivfflat se use (verificado con EXPLAIN, 399ms vs 13s):
  --  1) el umbral de score va FUERA del scan (subquery), no en el WHERE: un
  --     filtro de rango sobre la distancia fuerza seq scan.
  --  2) rama sin filtro cuando filter_bloque es null (el caso común): con el
  --     'where filter_bloque is null or ...' el planner no puede descartar el
  --     parámetro y cae a seq scan igualmente. Sin WHERE, usa el índice.
  if filter_bloque is null then
    return query
      select sub.id, sub.contenido, sub.metadata, sub.similarity
      from (
        select c.id, c.contenido, c.metadata,
               1 - (c.embedding <=> query_embedding) as similarity
        from chunks_rag c
        order by c.embedding <=> query_embedding
        limit greatest(match_count * 4, 20)
      ) sub
      where sub.similarity > match_threshold
      order by sub.similarity desc
      limit match_count;
  else
    return query
      select sub.id, sub.contenido, sub.metadata, sub.similarity
      from (
        select c.id, c.contenido, c.metadata,
               1 - (c.embedding <=> query_embedding) as similarity
        from chunks_rag c
        where c.metadata->>'bloque_oir' = filter_bloque
        order by c.embedding <=> query_embedding
        limit greatest(match_count * 4, 20)
      ) sub
      where sub.similarity > match_threshold
      order by sub.similarity desc
      limit match_count;
  end if;
end;
$$;
