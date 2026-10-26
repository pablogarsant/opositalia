-- Migración 0005 — Fase 6
-- Árbol de temario oficial BOJA: 4 niveles (bloque → tema → subtema → punto).

-- Columnas de mapeo BOJA↔Kanski en temas
alter table public.temas
  add column if not exists numero_boja integer,
  add column if not exists texto_boja text,
  add column if not exists parte text check (parte in ('comun', 'especifica')),
  add column if not exists capitulo_kanski text,
  add column if not exists paginas_kanski text;

-- Nivel 3: subtemas
create table if not exists public.subtemas (
  id          uuid primary key default uuid_generate_v4(),
  tema_id     uuid references public.temas(id) on delete cascade,
  titulo      text not null,
  orden       integer not null,
  descripcion text,
  created_at  timestamptz default now()
);

-- Nivel 4: puntos específicos (hojas del árbol)
create table if not exists public.puntos (
  id          uuid primary key default uuid_generate_v4(),
  subtema_id  uuid references public.subtemas(id) on delete cascade,
  titulo      text not null,
  orden       integer not null,
  descripcion text,
  keywords    text[],
  created_at  timestamptz default now()
);

-- Progreso del usuario por punto
create table if not exists public.progreso_puntos (
  id            uuid primary key default uuid_generate_v4(),
  perfil_id     uuid references public.perfiles(id) on delete cascade,
  punto_id      uuid references public.puntos(id) on delete cascade,
  dominio       integer default 0 check (dominio between 0 and 100),
  ultima_sesion timestamptz,
  unique(perfil_id, punto_id)
);

-- índices para la carga del árbol y el join de progreso
create index if not exists idx_subtemas_tema on public.subtemas(tema_id);
create index if not exists idx_puntos_subtema on public.puntos(subtema_id);
create index if not exists idx_progreso_puntos_perfil on public.progreso_puntos(perfil_id);

alter table public.subtemas        enable row level security;
alter table public.puntos          enable row level security;
alter table public.progreso_puntos enable row level security;

drop policy if exists "subtemas publicos" on public.subtemas;
create policy "subtemas publicos" on public.subtemas for select using (true);

drop policy if exists "puntos publicos" on public.puntos;
create policy "puntos publicos" on public.puntos for select using (true);

drop policy if exists "progreso_puntos propio" on public.progreso_puntos;
create policy "progreso_puntos propio" on public.progreso_puntos
  for all using (perfil_id = (
    select id from public.perfiles where clerk_id = auth.jwt()->>'sub'
  ));
