# Opositalia Constitution

## Core Principles

### I. Código Mínimo (YAGNI estricto)
Solo se escribe código que la especificación actual necesita. No se crean abstracciones antes de tener 3 usos reales. Ponytail activo: si un archivo puede no existir, no existe. Cada línea debe justificarse por un requisito de la fase en curso.

### II. TypeScript Estricto
`strict: true` en todo el proyecto. Prohibido `any` (explícito o implícito). Los tipos de datos viven en `src/types/` y `src/lib/*/types.ts`. Las respuestas de API siguen el contrato `{ data, error }`.

### III. Server-First
Server Components por defecto. Client Components (`"use client"`) solo cuando hay interactividad real (estado, eventos, browser APIs). El data fetching ocurre en el servidor. Zustand solo para estado de UI compartido entre client components.

### IV. Seguridad Por Diseño
- `SUPABASE_SERVICE_ROLE_KEY` jamás sale del servidor (solo en `src/lib/supabase/admin.ts`, importado únicamente desde route handlers/server actions).
- RLS activado en todas las tablas de usuario.
- Webhooks verifican firma criptográfica antes de procesar.
- Secretos solo en `.env.local` (gitignored); `.env.example` documenta las claves sin valores reales.

### V. Accesibilidad y Mobile-First
WCAG AA mínimo: contraste, focus visible, aria-labels en controles sin texto, navegación por teclado. Los layouts se diseñan primero para 375px y escalan hacia arriba.

## Workflow

- Cada feature en su rama `feature/*`, PR a `develop`, nunca push directo a `main`.
- Commits atómicos en inglés con prefijo `feat`/`fix`/`chore`/`docs`.
- Las decisiones de arquitectura no triviales se documentan como comentario en el código donde aplican.

## Governance

Esta constitución prevalece sobre preferencias individuales. Cualquier PR que la viole debe justificarlo explícitamente en la descripción o corregirse.

**Version**: 1.0.0 | **Ratified**: 2026-07-02 | **Last Amended**: 2026-07-02
