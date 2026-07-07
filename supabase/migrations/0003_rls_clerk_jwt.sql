-- Migración 0003 — Fase 3
-- RLS real con el JWT de Clerk (template "supabase").
--
-- Requiere en Clerk dashboard → JWT Templates → New → Supabase:
--   claims: {"role": "authenticated", "sub": "{{user.id}}"}
-- y en Supabase el JWT secret de Clerk configurado (o third-party auth Clerk).
--
-- Las políticas v1.0 usaban current_setting('app.clerk_id') que nunca se
-- inyectaba. Se reescriben leyendo el sub del JWT: auth.jwt()->>'sub'.

-- helper: perfil del usuario autenticado
create or replace function public.mi_perfil_id()
returns uuid
language sql stable
as $$
  select id from public.perfiles where clerk_id = auth.jwt()->>'sub';
$$;

-- perfiles
drop policy if exists "perfil propio" on public.perfiles;
create policy "perfil propio" on public.perfiles
  for all using (clerk_id = auth.jwt()->>'sub');

-- inscripciones
drop policy if exists "inscripciones propias" on public.inscripciones;
create policy "inscripciones propias" on public.inscripciones
  for all using (perfil_id = public.mi_perfil_id());

-- sesiones_plan
drop policy if exists "sesiones_plan propias" on public.sesiones_plan;
create policy "sesiones_plan propias" on public.sesiones_plan
  for all using (inscripcion_id in (
    select id from public.inscripciones where perfil_id = public.mi_perfil_id()
  ));

-- sesiones_estudio
drop policy if exists "sesiones_estudio propias" on public.sesiones_estudio;
create policy "sesiones_estudio propias" on public.sesiones_estudio
  for all using (perfil_id = public.mi_perfil_id());

-- progreso_temas
drop policy if exists "progreso propio" on public.progreso_temas;
create policy "progreso propio" on public.progreso_temas
  for all using (perfil_id = public.mi_perfil_id());

-- favoritos
drop policy if exists "favoritos propios" on public.favoritos;
create policy "favoritos propios" on public.favoritos
  for all using (perfil_id = public.mi_perfil_id());

-- notas
drop policy if exists "notas propias" on public.notas;
create policy "notas propias" on public.notas
  for all using (perfil_id = public.mi_perfil_id());

-- rachas
drop policy if exists "racha propia" on public.rachas;
create policy "racha propia" on public.rachas
  for all using (perfil_id = public.mi_perfil_id());

-- historial_plan
drop policy if exists "historial propio" on public.historial_plan;
create policy "historial propio" on public.historial_plan
  for all using (inscripcion_id in (
    select id from public.inscripciones where perfil_id = public.mi_perfil_id()
  ));

-- respuestas_examen
drop policy if exists "respuestas propias" on public.respuestas_examen;
create policy "respuestas propias" on public.respuestas_examen
  for all using (sesion_id in (
    select id from public.sesiones_estudio where perfil_id = public.mi_perfil_id()
  ));

-- lectura del temario para usuarios autenticados
alter table public.cursos  enable row level security;
alter table public.bloques enable row level security;
alter table public.temas   enable row level security;

drop policy if exists "cursos lectura" on public.cursos;
create policy "cursos lectura" on public.cursos
  for select using (auth.jwt() is not null);

drop policy if exists "bloques lectura" on public.bloques;
create policy "bloques lectura" on public.bloques
  for select using (auth.jwt() is not null);

drop policy if exists "temas lectura" on public.temas;
create policy "temas lectura" on public.temas
  for select using (auth.jwt() is not null);
