# Feature Specification: Fase 1 — Auth Clerk + Perfil + Dashboard Base

**Branch**: `feature/fase-1-auth-supabase` | **Date**: 2026-07-02 | **Status**: Approved

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Autenticación completa (Priority: P1)

Como opositora, quiero entrar con mi email y contraseña y llegar a mi dashboard, para acceder a mi preparación desde cualquier dispositivo.

**Acceptance:**
1. **Given** usuario anónimo en `/`, **When** pulsa "Entrar", **Then** navega a `/login` y ve el formulario de Clerk (email+contraseña, sin OAuth).
2. **Given** login exitoso, **Then** redirect a `/dashboard`.
3. **Given** usuario anónimo, **When** visita cualquier ruta del grupo dashboard, **Then** redirect a `/login`.
4. **Given** usuario autenticado, **When** visita `/login`, **Then** redirect a `/dashboard`.

### User Story 2 - Creación automática de perfil (Priority: P1)

Como sistema, cuando un usuario se registra en Clerk, debo crear su perfil en Supabase para que sus datos vivan en nuestra base.

**Acceptance:**
1. **Given** evento `user.created` de Clerk en `/api/webhooks/clerk` con firma válida, **Then** se crea fila en `public.perfiles` (clerk_id, nombre, email) y fila en `public.rachas` (racha_actual=0).
2. **Given** el mismo evento repetido (retry de Clerk), **Then** no falla ni duplica (idempotente).
3. **Given** petición sin firma válida, **Then** 400 sin tocar la base de datos.

### User Story 3 - Dashboard inicial (Priority: P2)

Como opositora autenticada, quiero ver mi dashboard con mi sesión de hoy y mi progreso, para saber qué me toca estudiar.

**Acceptance:**
1. Saludo con nombre del usuario (de perfil Supabase; fallback a datos de Clerk si el perfil aún no existe).
2. Card destacada "Sesión de hoy": "Anatomía ocular — Segmento anterior" (hardcodeada esta fase).
3. Stats: racha, temas completados, precisión exámenes, horas semana (datos mock).
4. Áreas a reforzar con topic bars semánticas (mock) y próximas sesiones (mock).
5. Sidebar: Dashboard, Sesión de hoy, Calendario, Informe semanal, Favoritos, Agenda, Burocracia, Plan de estudio.
6. Responsive: usable a 375px (sidebar colapsa a drawer con hamburger).

### User Story 4 - Selector de paleta (Priority: P2)

Como usuaria, quiero elegir entre 5 paletas de color para estudiar con la estética que me resulte más cómoda.

**Acceptance:**
1. Botón "🎨 {paleta} ▾" en topbar abre dropdown con las 5 paletas (punto de color + nombre).
2. Seleccionar cambia `data-theme` en `<html>` al instante, sin recargar.
3. La elección persiste en `localStorage` y se restaura al recargar sin flash (FOUC).
4. Si hay perfil en Supabase, la elección también se guarda en `perfiles.tema` (best-effort, no bloquea la UI).

### Edge Cases

- Webhook llega antes de que el usuario visite el dashboard → el dashboard tolera perfil existente.
- Webhook falla o aún no procesado → dashboard usa nombre de Clerk y no crashea.
- Supabase sin configurar (env vacías en dev) → dashboard degrada a datos de Clerk, no lanza error 500.
- localStorage con valor corrupto → cae a paleta "cielo".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Middleware de Clerk protege `/dashboard`, `/sesion`, `/plan`, `/calendario`, `/informe`, `/favoritos`, `/notas`, `/burocracia`. Públicas: `/`, `/login`, `/registro`, `/api/webhooks/clerk`.
- **FR-002**: Landing `/` mínima: logo, tagline, botón "Entrar" → `/login`.
- **FR-003**: `/login` renderiza `<SignIn>` de Clerk; `/registro` renderiza `<SignUp>` (el formulario de Clerk enlaza entre ambas).
- **FR-004**: Webhook `POST /api/webhooks/clerk` verifica firma (svix vía `verifyWebhook` de Clerk), procesa `user.created`, upsert idempotente en `perfiles` + `rachas` con service role.
- **FR-005**: Dashboard server component: lee `userId` de Clerk, busca perfil por `clerk_id` en Supabase, renderiza saludo + stats mock + sesión de hoy + áreas a reforzar + próximas sesiones.
- **FR-006**: Sistema de paletas: CSS custom properties por `data-theme` (cielo/salvia/arena/niebla/noche), tokens mapeados a Tailwind v4 via `@theme inline`.
- **FR-007**: Tipografía Lora (display) + Inter (body) vía `next/font/google` con subsetting.
- **FR-008**: `uiStore` (Zustand): tema activo + sidebar móvil abierto/cerrado.

### Key Entities

- **perfiles**: + columna `tema text default 'cielo'` (migración sobre schema v1.0).
- **rachas**: sin cambios; el webhook crea la fila inicial.

## Success Criteria *(mandatory)*

- **SC-001**: `npm run build` y `npx tsc --noEmit` pasan sin errores ni `any`.
- **SC-002**: Flujo login → dashboard funcional con claves reales de Clerk configuradas.
- **SC-003**: Cambio de paleta < 100ms percibido, persiste tras recarga, sin FOUC.
- **SC-004**: Webhook responde 200 a eventos válidos, 400 a firma inválida, idempotente en retries.
- **SC-005**: Dashboard usable a 375px sin scroll horizontal.

## Assumptions

1. "Agenda" del sidebar apunta a la ruta existente `/notas` (la tabla se llama `notas`; el label de UI es "Agenda").
2. `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` pasa de `/onboarding` a `/dashboard` — no hay onboarding en esta fase (YAGNI).
3. `perfiles.tema` se añade al schema como migración `supabase/migrations/0001_perfiles_tema.sql`; `schema.sql` se actualiza a v1.1 para instalaciones nuevas.
4. La verificación del webhook usa `verifyWebhook` de `@clerk/nextjs/webhooks` (svix por debajo) con `CLERK_WEBHOOK_SIGNING_SECRET`.
5. Datos de progreso reales (rachas, dominio, sesiones) llegan en Fase 3; esta fase muestra constantes mock claramente marcadas.
6. Sin Anthropic API en esta fase.
