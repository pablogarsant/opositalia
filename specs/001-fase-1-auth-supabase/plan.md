# Implementation Plan: Fase 1 — Auth Clerk + Perfil + Dashboard Base

**Spec**: [spec.md](./spec.md) | **Date**: 2026-07-02

## Summary

Autenticación con Clerk (middleware + login/registro), webhook que materializa el perfil en Supabase, dashboard server-rendered con datos mock y sistema de 5 paletas con CSS custom properties. Sin lógica de negocio de estudio, sin Anthropic.

## Technical Context

- Next.js 16.2.9 App Router, TypeScript strict, Tailwind v4 (`@theme inline` en globals.css)
- @clerk/nextjs 7.5.11 → `clerkMiddleware` + `createRouteMatcher`; webhook con `verifyWebhook` de `@clerk/nextjs/webhooks`
- @supabase/ssr para clientes browser/server; cliente admin (service role) solo server-side
- Zustand para tema + sidebar móvil; localStorage para persistencia local del tema
- Fuentes: `next/font/google` — Lora (`--font-lora`), Inter (`--font-inter`)

## Constitution Check

- YAGNI: no se crean hooks/stores nuevos salvo uiStore ya existente. PhaseX/PlanX stubs de Fase 0 no se tocan. ✔
- Server-first: dashboard, layouts y páginas son server components; client solo Sidebar (pathname activo), Topbar/PaletteSelector, MobileNav. ✔
- Seguridad: service role aislado en `admin.ts`; webhook verifica firma antes de parsear; RLS intacto. ✔

## Project Structure

```
src/
├── middleware.ts                      [NUEVO] clerkMiddleware
├── app/
│   ├── layout.tsx                     [MOD] ClerkProvider + fonts + theme script
│   ├── globals.css                    [MOD] tokens 5 paletas + @theme inline
│   ├── page.tsx                       [MOD] landing mínima
│   ├── (auth)/login/page.tsx          [MOD] <SignIn>
│   ├── (auth)/registro/page.tsx       [NUEVO] <SignUp>
│   ├── (dashboard)/layout.tsx         [NUEVO] shell Sidebar+Topbar
│   ├── (dashboard)/dashboard/page.tsx [MOD] dashboard completo
│   └── api/webhooks/clerk/route.ts    [NUEVO] user.created → perfil+racha
├── lib/
│   ├── supabase/admin.ts              [NUEVO] service role client (server-only)
│   └── perfil.ts                      [NUEVO] getPerfil + server action updateTema
├── components/
│   ├── layout/Sidebar.tsx             [MOD] nav 8 items + user info
│   ├── layout/Topbar.tsx              [MOD] logo + PaletteSelector + salir
│   ├── layout/PaletteSelector.tsx     [NUEVO] dropdown 5 paletas
│   └── dashboard/*                    [NUEVO] StatCard, SesionHoyCard, TopicBar list, ProximasSesiones
├── stores/uiStore.ts                  [MOD] tema tipado + persistencia
└── types/database.ts                  [MOD] perfiles.tema + rachas
supabase/
├── schema.sql                         [MOD] v1.1: perfiles.tema
└── migrations/0001_perfiles_tema.sql  [NUEVO]
```

## Decisiones

1. **Tema sin FOUC**: inline `<script>` en `<head>` lee localStorage y fija `data-theme` en `<html>` antes del primer paint. React no gestiona ese atributo (queda fuera de hydration) — `suppressHydrationWarning` en `<html>`.
2. **Paletas como tokens semánticos**: `--bg`, `--surface`, `--accent`, `--accent-dim`, `--text`, `--text-2`, `--text-3`, `--border` + semánticos fijos (`--ok`, `--warn`, `--danger`, `--info`) que no cambian entre paletas.
3. **verifyWebhook vs svix directo**: `verifyWebhook` usa svix internamente y evita dependencia directa de un paquete transitivo. Cumple el requisito de verificación svix.
4. **Dashboard resiliente**: `getPerfil()` devuelve `null` si Supabase no responde o no hay fila; el dashboard usa `currentUser()` de Clerk como fallback de nombre. Evita 500 en dev sin claves.
5. **Stats mock**: constantes en el propio `page.tsx` del dashboard marcadas `// MOCK Fase 3`, no en lib compartida (YAGNI).

## Complexity Tracking

Sin desviaciones de la constitución.
