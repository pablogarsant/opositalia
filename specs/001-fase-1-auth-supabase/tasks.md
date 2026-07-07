# Tasks: Fase 1 — Auth Clerk + Perfil + Dashboard Base

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 1: Setup

- [x] T001 Migración `supabase/migrations/0001_perfiles_tema.sql` + schema.sql v1.1 (perfiles.tema)
- [x] T002 `.env.example` y `.env.local`: añadir CLERK_WEBHOOK_SIGNING_SECRET, after-sign-up → /dashboard
- [x] T003 `src/types/database.ts`: tipos perfiles (con tema) + rachas

## Phase 2: Foundational

- [x] T004 `src/app/globals.css`: tokens 5 paletas + @theme inline Tailwind v4
- [x] T005 `src/app/layout.tsx`: ClerkProvider (localización es) + Lora/Inter + script anti-FOUC
- [x] T006 `src/middleware.ts`: clerkMiddleware, rutas públicas /, /login, /registro, /api/webhooks/clerk

## Phase 3: US1 — Autenticación (P1) 🎯

- [x] T007 `src/app/page.tsx`: landing mínima con botón Entrar
- [x] T008 `src/app/(auth)/login/page.tsx`: SignIn Clerk + redirect si ya autenticado
- [x] T009 `src/app/(auth)/registro/page.tsx`: SignUp Clerk

## Phase 4: US2 — Webhook perfil (P1) 🎯

- [x] T010 `src/lib/supabase/admin.ts`: cliente service role server-only
- [x] T011 `src/app/api/webhooks/clerk/route.ts`: verifyWebhook + upsert perfiles + rachas idempotente

## Phase 5: US3 — Dashboard (P2)

- [x] T012 `src/lib/perfil.ts`: getPerfil(clerkId) resiliente + server action updateTema
- [x] T013 `src/app/(dashboard)/layout.tsx`: shell con Sidebar + Topbar + drawer móvil
- [x] T014 `src/components/layout/Sidebar.tsx`: 8 items nav + active state + user info
- [x] T015 `src/app/(dashboard)/dashboard/page.tsx`: saludo + stats + sesión hoy + áreas + próximas

## Phase 6: US4 — Paletas (P2)

- [x] T016 `src/stores/uiStore.ts`: tema tipado, setTema → DOM + localStorage + server action
- [x] T017 `src/components/layout/PaletteSelector.tsx` + Topbar integración

## Phase 7: Polish

- [x] T018 Design pass ui-ux-pro-max: jerarquía, spacing, Lora en títulos, responsive 375px
- [x] T019 QA converge: checklist spec + `npm run build` + `tsc --noEmit` + lint
