-- Fase 8 — Datos reales de la convocatoria FEA Oftalmología (OEP 2025) en burocracia_cache.
-- Lanzar en Supabase → SQL Editor (proyecto opositalia), entero. Toca solo la fila 'OIR-SAS'.
-- Mismo contenido que DATOS_FALLBACK en src/lib/burocracia.ts (forma nueva: estado, tasa,
-- promoción interna, reparto 100/50, regla de nota mínima; sin enlace_boja, que ahora es fijo).
-- hash_contenido = null: la app lo recalcula en la siguiente comprobación con novedades.
-- updated_at = now(): la próxima comprobación web será dentro de 7 días.
-- Esperado: "UPDATE 1" (o "INSERT 0 1" si la fila no existía).

insert into public.burocracia_cache (convocatoria, datos, fuente_url, fecha_publicacion, hash_contenido, updated_at)
values (
  'OIR-SAS',
  '{
    "convocatoria": "FEA Oftalmología — OEP 2025",
    "especialidad": "FEA Oftalmología",
    "organismo": "SAS — Servicio Andaluz de Salud",
    "estado": "No hay convocatoria activa para 2026. El proceso en curso es el de la OEP 2025 (BOJA nº 45, 07/03/2025).",
    "total_plazas": 30,
    "plazas_ope": 29,
    "plazas_promocion_interna": 1,
    "plazas_discapacidad": 3,
    "tasa": {"general": 46.46, "telematica": 41.81},
    "fecha_examen": "Pendiente de publicación por el SAS",
    "plazo_inscripcion_inicio": "2025-03-07",
    "plazo_inscripcion_fin": "2025-04-28",
    "estructura_examen": {
      "preguntas": 150,
      "teoricas": 100,
      "practicas": 50,
      "preguntas_reserva": 3,
      "duracion_min": 180,
      "penalizacion": "Cada error resta 1/4 de un acierto (−E/4)",
      "nota_minima": "Turno libre: 60 % de la media de las 10 mejores notas; mínimo absoluto, 40 % de la puntuación máxima"
    },
    "timeline": [
      {"fecha": "2025-01-27", "hito": "Bases generales", "descripcion": "BOJA nº 17", "completado": true},
      {"fecha": "2025-03-07", "hito": "Convocatoria FEA Oftalmología", "descripcion": "BOJA nº 45", "completado": true},
      {"fecha": "Pendiente", "hito": "Fecha del examen", "descripcion": "La publica el SAS en el cuadro de evolución", "completado": false}
    ],
    "requisitos": [
      "Licenciado/Graduado en Medicina y Cirugía",
      "Título de Especialista en Oftalmología vía MIR",
      "Nacionalidad española o comunitaria (o asimilado por Tratados Internacionales)",
      "No haber sido separado por expediente disciplinario en los 6 años anteriores",
      "No estar inhabilitado para el ejercicio de funciones públicas",
      "No poseer plaza de personal estatutario fijo en la misma categoría en el SNS"
    ],
    "ultima_actualizacion": "2026-10-26 — datos oficiales SAS/BOJA revisados a mano"
  }'::jsonb,
  'https://www.sspa.juntadeandalucia.es/servicioandaluzdesalud/profesionales/ofertas-de-empleo/oferta-de-empleo-publico-puestos-base/convocatorias-oep-2025/cuadro-de-evolucion/fea-oftalmologia',
  '2025-03-07',
  null,
  now()
)
on conflict (convocatoria) do update
  set datos = excluded.datos,
      fuente_url = excluded.fuente_url,
      fecha_publicacion = excluded.fecha_publicacion,
      hash_contenido = null,
      updated_at = now();

-- Comprobación: debe devolver la fila con estado y tasa
select convocatoria, updated_at, datos->>'estado' as estado, datos->'tasa' as tasa
from public.burocracia_cache where convocatoria = 'OIR-SAS';
