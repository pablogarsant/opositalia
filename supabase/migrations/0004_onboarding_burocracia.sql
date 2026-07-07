-- Migración 0004 — Fase 4
-- Onboarding + configuración de plan en el perfil, y caché de burocracia.

alter table public.perfiles
  add column if not exists onboarding_completado boolean default false,
  add column if not exists curso_id uuid references public.cursos(id);
-- La config del plan (días, horas, intensidad, fecha examen) vive en
-- inscripciones.config_plan + fecha_examen (schema v1.0), no aquí.

create table if not exists public.burocracia_cache (
  id uuid primary key default uuid_generate_v4(),
  convocatoria text not null default 'OIR-SAS',
  datos jsonb not null,
  fuente_url text,
  fecha_publicacion date,
  hash_contenido text,
  updated_at timestamptz default now()
);
alter table public.burocracia_cache enable row level security;

drop policy if exists "lectura publica burocracia" on public.burocracia_cache;
create policy "lectura publica burocracia"
  on public.burocracia_cache for select using (true);
