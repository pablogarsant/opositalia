-- Migración 0008 — Fase 7
-- Vista libro (caché de contenido formateado) + grafo del temario (relaciones).

-- Markdown ya limpio de un punto/subtema: se genera una vez y se reutiliza.
create table if not exists public.contenido_formateado (
  id            uuid primary key default uuid_generate_v4(),
  punto_id      uuid references public.puntos(id) on delete cascade,
  subtema_id    uuid references public.subtemas(id) on delete cascade,
  contenido_md  text not null,
  fuentes       jsonb,
  generado_en   timestamptz default now(),
  unique(punto_id)
);

create index if not exists idx_contenido_formateado_subtema
  on public.contenido_formateado(subtema_id);

alter table public.contenido_formateado enable row level security;
drop policy if exists "contenido publico" on public.contenido_formateado;
create policy "contenido publico" on public.contenido_formateado
  for select using (true);

-- Aristas temáticas del grafo (no jerárquicas): T76 ↔ T96, etc.
create table if not exists public.relaciones_temas (
  id            uuid primary key default uuid_generate_v4(),
  tema_a_id     uuid references public.temas(id) on delete cascade,
  tema_b_id     uuid references public.temas(id) on delete cascade,
  peso          numeric(3,2) default 0.5,
  motivo        text,
  unique(tema_a_id, tema_b_id)
);

create index if not exists idx_relaciones_temas_a on public.relaciones_temas(tema_a_id);
create index if not exists idx_relaciones_temas_b on public.relaciones_temas(tema_b_id);

alter table public.relaciones_temas enable row level security;
drop policy if exists "relaciones publicas" on public.relaciones_temas;
create policy "relaciones publicas" on public.relaciones_temas
  for select using (true);
