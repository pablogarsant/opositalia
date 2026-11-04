-- Migración 0010 — Batería de tarjetas y preguntas por tema.
-- Idempotente. Lanzar en Supabase → SQL Editor (proyecto opositalia) ANTES de desplegar el código.
-- No genera nada con IA: solo crea las tablas y reaprovecha lo ya pagado en sesion_cache.

-- Material de cada tema, compartido entre alumnas.
create table if not exists public.banco_items (
  id          uuid primary key default uuid_generate_v4(),
  tema_id     uuid not null references public.temas(id) on delete cascade,
  tipo        text not null check (tipo in ('repaso', 'examen')),
  texto       text not null,   -- pregunta o enunciado: evita duplicados exactos
  contenido   jsonb not null,
  created_at  timestamptz default now(),
  unique (tema_id, tipo, texto)
);

-- Qué ha visto cada alumna, para no repetirle material.
create table if not exists public.items_vistos (
  perfil_id   uuid not null references public.perfiles(id) on delete cascade,
  item_id     uuid not null references public.banco_items(id) on delete cascade,
  visto_en    timestamptz not null default now(),
  primary key (perfil_id, item_id)
);
create index if not exists idx_items_vistos_item on public.items_vistos(item_id);

-- Solo el servidor (service role) lee y escribe, igual que sesion_cache.
alter table public.banco_items enable row level security;
alter table public.items_vistos enable row level security;

-- Lo ya generado pasa a la batería.
insert into public.banco_items (tema_id, tipo, texto, contenido)
select c.tema_id, 'repaso', x->>'pregunta', x
from public.sesion_cache c, jsonb_array_elements(c.contenido->'flashcards') x
where c.tipo = 'repaso' and c.tema_id is not null and x->>'pregunta' is not null
on conflict do nothing;

insert into public.banco_items (tema_id, tipo, texto, contenido)
select c.tema_id, 'examen', x->>'enunciado', x
from public.sesion_cache c, jsonb_array_elements(c.contenido->'preguntas') x
where c.tipo = 'examen' and c.tema_id is not null and x->>'enunciado' is not null
on conflict do nothing;

-- Las preguntas que cada alumna ya contestó cuentan como vistas.
-- Las tarjetas no: volver a verlas en el repaso es justo su función.
insert into public.items_vistos (perfil_id, item_id, visto_en)
select distinct on (e.perfil_id, b.id) e.perfil_id, b.id, r.created_at
from public.respuestas_examen r
join public.sesiones_estudio e on e.id = r.sesion_id
join public.banco_items b on b.tipo = 'examen' and b.texto = r.pregunta_texto
order by e.perfil_id, b.id, r.created_at desc
on conflict do nothing;
