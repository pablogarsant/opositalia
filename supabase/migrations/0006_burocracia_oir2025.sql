-- Migración 0006 — Fase 6
-- Datos reales de la convocatoria FEA OIR 2025 (SAS) en el caché de burocracia.
-- Mismo shape que src/lib/burocracia.ts (DatosBurocracia) para que la página no
-- muestre campos vacíos. Idempotente por 'convocatoria'.

create unique index if not exists uq_burocracia_convocatoria
  on public.burocracia_cache(convocatoria);

insert into public.burocracia_cache (convocatoria, datos, fuente_url, fecha_publicacion, hash_contenido)
values (
  'OIR-SAS',
  '{
    "convocatoria": "FEA OIR 2025",
    "especialidad": "FEA Oftalmología",
    "organismo": "SAS — Servicio Andaluz de Salud",
    "total_plazas": 30,
    "plazas_ope": 29,
    "plazas_discapacidad": 3,
    "fecha_examen": "Pendiente de publicación (2026)",
    "plazo_inscripcion_inicio": "2025-03-07",
    "plazo_inscripcion_fin": "2025-04-28",
    "enlace_boja": "https://www.sspa.juntadeandalucia.es/servicioandaluzdesalud/profesionales/ofertas-de-empleo/oferta-de-empleo-publico-puestos-base/convocatorias-oep-2025/cuadro-de-evolucion/fea-oftalmologia",
    "estructura_examen": {
      "preguntas": 150,
      "preguntas_reserva": 3,
      "duracion_min": 180,
      "penalizacion": "Un error resta 1/4 de un acierto (-E/4)",
      "nota_minima": 40
    },
    "timeline": [
      {"fecha": "2025-01-27", "hito": "Publicación bases generales", "descripcion": "BOJA nº 17", "completado": true},
      {"fecha": "2025-03-07", "hito": "Convocatoria específica FEA Oftalmología", "descripcion": "BOJA nº 45", "completado": true},
      {"fecha": "2025-04-29", "hito": "Plazo de autobaremo de méritos", "descripcion": "15 días hábiles", "completado": true},
      {"fecha": "2025-12-31", "hito": "Lista provisional de admitidos", "descripcion": "Pendiente de publicación por el SAS", "completado": false},
      {"fecha": "2026-06-30", "hito": "Fecha del examen", "descripcion": "Pendiente de publicación", "completado": false},
      {"fecha": "2026-12-31", "hito": "Resolución y adjudicación de plazas", "descripcion": "Pendiente", "completado": false}
    ],
    "requisitos": [
      "Licenciado/Graduado en Medicina y Cirugía",
      "Título de Especialista en Oftalmología vía MIR",
      "Nacionalidad española o comunitaria (o asimilado por Tratados Internacionales)",
      "No haber sido separado por expediente disciplinario en los 6 años anteriores",
      "No estar inhabilitado para el ejercicio de funciones públicas",
      "No poseer plaza de personal estatutario fijo en la misma categoría en el SNS"
    ],
    "ultima_actualizacion": "2025-07-12 — fuentes oficiales SAS/BOJA"
  }'::jsonb,
  'https://www.juntadeandalucia.es/eboja.html',
  '2025-03-07',
  md5('FEA-OIR-SAS-2025-v2')
)
on conflict (convocatoria) do update
  set datos = excluded.datos,
      fuente_url = excluded.fuente_url,
      fecha_publicacion = excluded.fecha_publicacion,
      hash_contenido = excluded.hash_contenido,
      updated_at = now();
