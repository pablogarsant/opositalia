-- Migración 0002 — Fase 3
-- Cache de contenido de sesión generado por IA (no regenerar cada vez).

create table if not exists public.sesion_cache (
  id          uuid primary key default uuid_generate_v4(),
  cache_key   text unique not null,        -- p.ej. 'parpados:repaso'
  tema_id     uuid references public.temas(id),
  bloque      text not null,
  tipo        text not null check (tipo in ('lectura', 'repaso', 'examen')),
  contenido   jsonb not null,
  created_at  timestamptz default now()
);

-- Solo el servidor (service role) lee/escribe este cache.
alter table public.sesion_cache enable row level security;
