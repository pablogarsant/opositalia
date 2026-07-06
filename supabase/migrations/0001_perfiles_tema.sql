-- Migración 0001 — Fase 1
-- Añade preferencia de paleta de color al perfil.
-- Aplicar sobre bases creadas con schema.sql v1.0.

alter table public.perfiles
  add column if not exists tema text default 'cielo'
  check (tema in ('cielo', 'salvia', 'arena', 'niebla', 'noche'));
