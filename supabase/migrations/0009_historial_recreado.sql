-- Migración 0009 — Fase 8: historial_plan registra cuándo se recrea el plan.
-- Idempotente. Lanzar en Supabase → SQL Editor (proyecto opositalia).
-- Sin ella, /api/plan/recrear funciona pero no puede anotar el cambio
-- (lo deja en el log y avisa en la respuesta).

alter table public.historial_plan drop constraint if exists historial_plan_tipo_check;
alter table public.historial_plan
  add constraint historial_plan_tipo_check
  check (tipo in ('perdida', 'recuperada', 'refuerzo', 'resultado', 'recreado'));
