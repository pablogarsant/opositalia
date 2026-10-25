-- Auditoría de estado — Fase 8. SOLO LECTURA: no modifica nada.
-- Lanzar en Supabase → SQL Editor (proyecto opositalia, ref zjjhejhybjitstmcbppq).
-- Cada bloque devuelve una tabla; el SQL Editor muestra solo el último resultado,
-- así que lanza los bloques de uno en uno (selecciona el bloque → Run).

-- ── 1. Migraciones: ¿existe el objeto que crea cada una? ─────────────────
-- Las migraciones se aplicaron a mano por SQL Editor: no hay tabla de control
-- fiable, se comprueba el objeto que deja cada una.
select m.migracion, m.objeto, m.existe
from (values
  ('0001_perfiles_tema',        'perfiles.tema',
     exists (select 1 from information_schema.columns where table_schema='public' and table_name='perfiles' and column_name='tema')),
  ('0002_sesion_cache',         'tabla sesion_cache',            to_regclass('public.sesion_cache') is not null),
  ('0003_rls_clerk_jwt',        'función mi_perfil_id()',        to_regprocedure('public.mi_perfil_id()') is not null),
  ('0004_onboarding_burocracia','perfiles.onboarding_completado',
     exists (select 1 from information_schema.columns where table_schema='public' and table_name='perfiles' and column_name='onboarding_completado')),
  ('0005_temario_arbol',        'tablas subtemas/puntos/progreso_puntos',
     to_regclass('public.subtemas') is not null and to_regclass('public.puntos') is not null and to_regclass('public.progreso_puntos') is not null),
  ('0006_burocracia_oir2025',   'tabla burocracia_cache',        to_regclass('public.burocracia_cache') is not null),
  ('0007_vector_index',         'índice idx_chunks_rag_embedding_ivf', to_regclass('public.idx_chunks_rag_embedding_ivf') is not null),
  ('0008_lectura_grafo',        'tablas contenido_formateado/relaciones_temas',
     to_regclass('public.contenido_formateado') is not null and to_regclass('public.relaciones_temas') is not null)
) as m(migracion, objeto, existe)
order by 1;

-- ── 2. Todas las tablas que dependen (directa o transitivamente) de perfiles ─
-- Compara con la lista conocida de 02_borrar_cuentas.sql antes de borrar.
with recursive deps as (
  select c.conrelid::regclass as tabla, c.confrelid::regclass as referencia, 1 as nivel,
         pg_get_constraintdef(c.oid) as fk
  from pg_constraint c
  where c.contype = 'f' and c.confrelid = 'public.perfiles'::regclass
  union
  select c.conrelid::regclass, c.confrelid::regclass, d.nivel + 1, pg_get_constraintdef(c.oid)
  from pg_constraint c
  join deps d on c.confrelid = d.tabla::oid
  where c.contype = 'f' and d.nivel < 5
)
select tabla, referencia, nivel, fk from deps order by nivel, tabla::text;

-- ── 3. Volumen de datos de usuario ───────────────────────────────────────
select 'perfiles' t, count(*) from perfiles
union all select 'inscripciones', count(*) from inscripciones
union all select 'sesiones_plan', count(*) from sesiones_plan
union all select 'historial_plan', count(*) from historial_plan
union all select 'sesiones_estudio', count(*) from sesiones_estudio
union all select 'respuestas_examen', count(*) from respuestas_examen
union all select 'progreso_temas', count(*) from progreso_temas
union all select 'progreso_puntos', count(*) from progreso_puntos
union all select 'favoritos', count(*) from favoritos
union all select 'notas', count(*) from notas
union all select 'rachas', count(*) from rachas;

-- ── 4. Bug "Sesión de hoy": estado real del plan de cada usuaria ─────────
-- ¿Hay sesión con fecha_programada = hoy (hora Madrid)? ¿Alguna llegó a 'completada'?
-- ¿sesiones_estudio enlaza con sesiones_plan (sesion_plan_id)?
select p.email,
       count(*) filter (where sp.estado = 'pendiente')                                    as pendientes,
       count(*) filter (where sp.estado = 'completada')                                   as completadas,
       count(*) filter (where sp.fecha_programada = (now() at time zone 'Europe/Madrid')::date) as de_hoy,
       min(sp.fecha_programada) filter (where sp.estado = 'pendiente')                    as primera_pendiente,
       min(sp.created_at) as plan_creado, max(sp.created_at) as ultima_creacion,
       (select count(*) from sesiones_estudio se where se.perfil_id = p.id)                  as sesiones_estudio,
       (select count(*) from sesiones_estudio se where se.perfil_id = p.id and se.sesion_plan_id is not null) as estudio_enlazadas
from perfiles p
join inscripciones i on i.perfil_id = p.id
join sesiones_plan sp on sp.inscripcion_id = i.id
group by p.id, p.email;

-- 4b. Primeras 10 sesiones pendientes de cada plan (tema, fecha, orden)
select p.email, sp.fecha_programada, sp.orden, sp.tipo, sp.estado, t.titulo as tema, sp.created_at
from sesiones_plan sp
join inscripciones i on i.id = sp.inscripcion_id
join perfiles p on p.id = i.perfil_id
left join temas t on t.id = sp.tema_id
where sp.estado = 'pendiente'
order by p.email, sp.fecha_programada, sp.orden
limit 30;

-- 4c. ¿El plan se regenera? Varias created_at distintas = varias generaciones
select i.id as inscripcion, date_trunc('minute', sp.created_at) as generado, count(*)
from sesiones_plan sp join inscripciones i on i.id = sp.inscripcion_id
group by 1, 2 order by 1, 2;

-- ── 5. Caché de sesión: contenido viejo que sobreviviría a cambiar el prompt ─
select tipo, count(*), min(created_at), max(created_at) from sesion_cache group by tipo;

-- ── 6. Corpus RAG por fuente ─────────────────────────────────────────────
select coalesce(metadata->>'fuente', '(sin fuente)') as fuente, count(*) as chunks
from chunks_rag group by 1 order by 2 desc;

-- 6b. Los 9 PDFs de Refractiva que fallaron por saldo (0 = no ingestado; >0 puede ser parcial)
select d.titulo, count(c.id) as chunks,
       max((c.metadata->'paginas'->>1)::int) as ultima_pagina_ingestada
from documentos d
left join chunks_rag c on c.documento_id = d.id
where d.titulo like 'master/5.%'
group by d.titulo order by d.titulo;

-- ── 7. Burocracia ────────────────────────────────────────────────────────
select convocatoria, updated_at, now() - updated_at as antiguedad, fuente_url,
       datos->>'enlace_boja' as enlace_boja, datos->>'fecha_examen' as fecha_examen,
       datos->>'ultima_actualizacion' as ultima_actualizacion
from burocracia_cache;

-- ── 8. Relaciones del grafo (requiere 0008) ──────────────────────────────
select count(*) as relaciones, count(*) filter (where motivo ilike '%manual%') as manuales
from relaciones_temas;
