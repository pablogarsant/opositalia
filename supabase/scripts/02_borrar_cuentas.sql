-- Borrado de TODAS las cuentas de usuario — Fase 8.
-- ⚠ IRREVERSIBLE. Borra datos de usuario de producción. Haz antes un backup
--   (Supabase → Database → Backups, o pg_dump) y lanza 01_auditoria_estado.sql
--   bloques 2 y 3 para saber qué se va a borrar.
--
-- Orden obligatorio: PRIMERO este script en Supabase, DESPUÉS borrar los
-- usuarios en Clerk. Al revés quedan perfiles huérfanos y el webhook choca
-- al recrear a alguien con el mismo email.
--
-- NO toca contenido: temas, bloques, cursos, subtemas, puntos, documentos,
-- chunks_rag, sesion_cache, contenido_formateado, relaciones_temas, burocracia_cache.
--
-- Lanzar en Supabase → SQL Editor, entero. Todo va en una transacción: si el
-- guard de FKs encuentra una tabla desconocida, aborta sin borrar nada.

begin;

-- Guard: aborta si alguna tabla depende de perfiles (directa o transitivamente)
-- y no está en la lista que este script sabe borrar.
do $$
declare
  conocidas text[] := array[
    'inscripciones','sesiones_plan','historial_plan','sesiones_estudio',
    'respuestas_examen','progreso_temas','progreso_puntos','favoritos','notas','rachas'
  ];
  desconocidas text;
begin
  with recursive deps as (
    select c.conrelid as tabla, 1 as nivel
    from pg_constraint c
    where c.contype = 'f' and c.confrelid = 'public.perfiles'::regclass
    union
    select c.conrelid, d.nivel + 1
    from pg_constraint c join deps d on c.confrelid = d.tabla
    where c.contype = 'f' and d.nivel < 5
  )
  select string_agg(distinct relname, ', ') into desconocidas
  from deps join pg_class on pg_class.oid = deps.tabla
  where relname <> all (conocidas) and relname <> 'perfiles';

  if desconocidas is not null then
    raise exception 'Tablas con FK a perfiles no contempladas: %. Añádelas al script antes de borrar.', desconocidas;
  end if;
end $$;

-- Hijos antes que padres: sesiones_estudio e historial_plan apuntan a
-- sesiones_plan SIN on delete cascade, así que van antes que sesiones_plan.
delete from public.respuestas_examen;
delete from public.sesiones_estudio;
delete from public.historial_plan;
delete from public.sesiones_plan;
delete from public.inscripciones;
delete from public.progreso_puntos;
delete from public.progreso_temas;
delete from public.favoritos;
delete from public.notas;
delete from public.rachas;
delete from public.perfiles;

-- Verificación dentro de la transacción: todo debe salir 0
-- y el contenido debe seguir con sus filas.
select 'perfiles' t, count(*) n from perfiles
union all select 'inscripciones', count(*) from inscripciones
union all select 'sesiones_plan', count(*) from sesiones_plan
union all select 'sesiones_estudio', count(*) from sesiones_estudio
union all select 'progreso_temas', count(*) from progreso_temas
union all select 'progreso_puntos', count(*) from progreso_puntos
union all select 'rachas', count(*) from rachas
union all select '[contenido] temas', count(*) from temas
union all select '[contenido] chunks_rag', count(*) from chunks_rag
union all select '[contenido] burocracia_cache', count(*) from burocracia_cache;

commit;
