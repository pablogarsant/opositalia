-- ══════════════════════════════════════════
-- OPOSITALIA — Schema v1.1
-- (v1.1: perfiles.tema — ver migrations/0001)
-- ══════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- ──────────────────────────────────────────
-- USUARIOS Y PERFILES
-- ──────────────────────────────────────────
create table public.perfiles (
  id            uuid primary key default uuid_generate_v4(),
  clerk_id      text unique not null,
  nombre        text,
  email         text,
  rol           text default 'alumno' check (rol in ('alumno', 'admin', 'tutor')),
  avatar_url    text,
  tema          text default 'cielo' check (tema in ('cielo', 'salvia', 'arena', 'niebla', 'noche')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ──────────────────────────────────────────
-- CURSOS Y TEMARIO
-- ──────────────────────────────────────────
create table public.cursos (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,
  titulo        text not null,
  descripcion   text,
  especialidad  text,
  comunidad     text default 'andalucia',
  activo        boolean default true,
  created_at    timestamptz default now()
);

create table public.bloques (
  id              uuid primary key default uuid_generate_v4(),
  curso_id        uuid references public.cursos(id) on delete cascade,
  titulo          text not null,
  orden           integer not null,
  horas_estimadas numeric(4,1) default 2.0
);

create table public.temas (
  id              uuid primary key default uuid_generate_v4(),
  bloque_id       uuid references public.bloques(id) on delete cascade,
  titulo          text not null,
  orden           integer not null,
  horas_estimadas numeric(4,1) default 2.0,
  dificultad      integer default 2 check (dificultad between 1 and 5)
);

-- ──────────────────────────────────────────
-- INSCRIPCIONES Y PLANES
-- ──────────────────────────────────────────
create table public.inscripciones (
  id              uuid primary key default uuid_generate_v4(),
  perfil_id       uuid references public.perfiles(id) on delete cascade,
  curso_id        uuid references public.cursos(id) on delete cascade,
  fecha_inicio    date not null,
  fecha_examen    date,
  config_plan     jsonb default '{}',
  activa          boolean default true,
  created_at      timestamptz default now(),
  unique(perfil_id, curso_id)
);

create table public.sesiones_plan (
  id               uuid primary key default uuid_generate_v4(),
  inscripcion_id   uuid references public.inscripciones(id) on delete cascade,
  tema_id          uuid references public.temas(id),
  bloque_id        uuid references public.bloques(id),
  fecha_programada date not null,
  tipo             text not null check (tipo in ('lectura', 'repaso', 'examen')),
  estado           text default 'pendiente' check (estado in ('pendiente', 'completada', 'perdida', 'saltada')),
  es_refuerzo      boolean default false,
  es_recuperada    boolean default false,
  motivo_cambio    text,
  orden            integer,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create table public.historial_plan (
  id             uuid primary key default uuid_generate_v4(),
  inscripcion_id uuid references public.inscripciones(id) on delete cascade,
  tipo           text not null check (tipo in ('perdida', 'recuperada', 'refuerzo', 'resultado')),
  motivo         text not null,
  detalle        text,
  sesion_origen  uuid references public.sesiones_plan(id),
  sesion_nueva   uuid references public.sesiones_plan(id),
  created_at     timestamptz default now()
);

-- ──────────────────────────────────────────
-- PROGRESO Y DOMINIO
-- ──────────────────────────────────────────
create table public.progreso_temas (
  id              uuid primary key default uuid_generate_v4(),
  perfil_id       uuid references public.perfiles(id) on delete cascade,
  tema_id         uuid references public.temas(id) on delete cascade,
  bloque_id       uuid references public.bloques(id),
  dominio         integer default 0 check (dominio between 0 and 100),
  sesiones_hechas integer default 0,
  ultima_sesion   timestamptz,
  updated_at      timestamptz default now(),
  unique(perfil_id, tema_id)
);

-- ──────────────────────────────────────────
-- SESIONES DE ESTUDIO (actividad real)
-- ──────────────────────────────────────────
create table public.sesiones_estudio (
  id             uuid primary key default uuid_generate_v4(),
  perfil_id      uuid references public.perfiles(id) on delete cascade,
  sesion_plan_id uuid references public.sesiones_plan(id),
  tema_id        uuid references public.temas(id),
  fase_actual    integer default 1 check (fase_actual between 1 and 5),
  completada     boolean default false,
  duracion_seg   integer default 0,
  iniciada_en    timestamptz default now(),
  completada_en  timestamptz
);

create table public.respuestas_examen (
  id              uuid primary key default uuid_generate_v4(),
  sesion_id       uuid references public.sesiones_estudio(id) on delete cascade,
  pregunta_texto  text not null,
  opcion_elegida  integer,
  opcion_correcta integer not null,
  es_correcta     boolean not null,
  tiempo_seg      integer,
  bloque          text,
  created_at      timestamptz default now()
);

-- ──────────────────────────────────────────
-- FAVORITOS Y NOTAS
-- ──────────────────────────────────────────
create table public.favoritos (
  id         uuid primary key default uuid_generate_v4(),
  perfil_id  uuid references public.perfiles(id) on delete cascade,
  tipo       text not null check (tipo in ('flashcard', 'idea_clave', 'mnemotecnia', 'pregunta', 'texto')),
  titulo     text,
  contenido  jsonb not null,
  tema_id    uuid references public.temas(id),
  bloque     text,
  created_at timestamptz default now()
);

create table public.notas (
  id         uuid primary key default uuid_generate_v4(),
  perfil_id  uuid references public.perfiles(id) on delete cascade,
  contenido  text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ──────────────────────────────────────────
-- BASE DOCUMENTAL RAG
-- ──────────────────────────────────────────
create table public.documentos (
  id          uuid primary key default uuid_generate_v4(),
  curso_id    uuid references public.cursos(id),
  titulo      text not null,
  tipo        text check (tipo in ('libro', 'paper', 'apuntes', 'examen_previo', 'guia_clinica', 'web')),
  fuente      text,
  uploaded_at timestamptz default now()
);

create table public.chunks_rag (
  id           uuid primary key default uuid_generate_v4(),
  documento_id uuid references public.documentos(id) on delete cascade,
  tema_id      uuid references public.temas(id),
  bloque_id    uuid references public.bloques(id),
  contenido    text not null,
  embedding    vector(1536),
  metadata     jsonb default '{}',
  created_at   timestamptz default now()
);

create index on public.chunks_rag using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ──────────────────────────────────────────
-- GAMIFICACIÓN
-- ──────────────────────────────────────────
create table public.rachas (
  id            uuid primary key default uuid_generate_v4(),
  perfil_id     uuid references public.perfiles(id) on delete cascade unique,
  racha_actual  integer default 0,
  racha_maxima  integer default 0,
  ultima_sesion date,
  updated_at    timestamptz default now()
);

-- ──────────────────────────────────────────
-- RLS — Row Level Security
-- ──────────────────────────────────────────
alter table public.perfiles          enable row level security;
alter table public.inscripciones     enable row level security;
alter table public.sesiones_plan     enable row level security;
alter table public.sesiones_estudio  enable row level security;
alter table public.progreso_temas    enable row level security;
alter table public.favoritos         enable row level security;
alter table public.notas             enable row level security;
alter table public.rachas            enable row level security;
alter table public.historial_plan    enable row level security;
alter table public.respuestas_examen enable row level security;

create policy "perfil propio" on public.perfiles
  for all using (clerk_id = current_setting('app.clerk_id', true));

create policy "inscripciones propias" on public.inscripciones
  for all using (perfil_id = (
    select id from public.perfiles
    where clerk_id = current_setting('app.clerk_id', true)
  ));

create policy "sesiones_plan propias" on public.sesiones_plan
  for all using (inscripcion_id in (
    select i.id from public.inscripciones i
    join public.perfiles p on p.id = i.perfil_id
    where p.clerk_id = current_setting('app.clerk_id', true)
  ));

create policy "sesiones_estudio propias" on public.sesiones_estudio
  for all using (perfil_id = (
    select id from public.perfiles
    where clerk_id = current_setting('app.clerk_id', true)
  ));

create policy "progreso propio" on public.progreso_temas
  for all using (perfil_id = (
    select id from public.perfiles
    where clerk_id = current_setting('app.clerk_id', true)
  ));

create policy "favoritos propios" on public.favoritos
  for all using (perfil_id = (
    select id from public.perfiles
    where clerk_id = current_setting('app.clerk_id', true)
  ));

create policy "notas propias" on public.notas
  for all using (perfil_id = (
    select id from public.perfiles
    where clerk_id = current_setting('app.clerk_id', true)
  ));

create policy "racha propia" on public.rachas
  for all using (perfil_id = (
    select id from public.perfiles
    where clerk_id = current_setting('app.clerk_id', true)
  ));

create policy "historial propio" on public.historial_plan
  for all using (inscripcion_id in (
    select i.id from public.inscripciones i
    join public.perfiles p on p.id = i.perfil_id
    where p.clerk_id = current_setting('app.clerk_id', true)
  ));

create policy "respuestas propias" on public.respuestas_examen
  for all using (sesion_id in (
    select id from public.sesiones_estudio
    where perfil_id = (
      select id from public.perfiles
      where clerk_id = current_setting('app.clerk_id', true)
    )
  ));

-- ──────────────────────────────────────────
-- DATOS SEMILLA — Curso OIR Andalucía 2026
-- ──────────────────────────────────────────
insert into public.cursos (slug, titulo, descripcion, especialidad, comunidad) values
  ('oir-sas-2026', 'Oposición Oftalmólogo SAS', 'Preparación completa OIR 2026 — Servicio Andaluz de Salud', 'Oftalmología', 'andalucia');
