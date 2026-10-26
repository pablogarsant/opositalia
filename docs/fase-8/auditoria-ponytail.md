# Auditoría ponytail de `src/` — Fase 8

Generada el 2026-10-25 sobre `feature/fase-7-lectura-grafo-chat` (`e3f2f92`). Solo lista: no se ha aplicado nada. Cada hallazgo requiere OK antes de tocarlo.

Evidencia: `grep` de imports en `src/` (incluido `import()` dinámico) y de `from '<paquete>'` para dependencias.

| # | Tag | Qué se recorta | Sustituto | Ruta |
|---|---|---|---|---|
| 1 | delete | 7 dependencias sin ningún import en `src/`: `react-hook-form`, `@hookform/resolvers`, `next-pwa` (ya desactivado en `next.config`), `rehype-raw`, `date-fns`, `clsx`, `tailwind-merge` (las tres últimas solo las usan ficheros muertos, ver 2 y 3) | nada | `package.json` |
| 2 | delete | `scheduler.ts` (`siguienteFechaDisponible`, `formatFecha`): nadie lo importa. Es el único uso de `date-fns` | nada | `src/lib/plan/scheduler.ts` |
| 3 | delete | `cn()`: nadie lo importa. Es el único uso de `clsx` + `tailwind-merge` | nada | `src/lib/utils.ts` |
| 4 | delete | Hooks sin uso: `usePlan`, `useProgreso`, `useSesion` | nada | `src/hooks/usePlan.ts`, `src/hooks/useProgreso.ts`, `src/hooks/useSesion.ts` |
| 5 | delete | `planStore`: solo lo usa `usePlan` (muerto) | nada | `src/stores/planStore.ts` |
| 6 | delete | `ProgressBar`: nadie lo importa | nada | `src/components/shared/ProgressBar.tsx` |
| 7 | delete | `generarMnemotecnia`: nadie lo importa; `/api/mnemotecnia` es un stub que devuelve 501 | borrar ambos o implementarlo cuando haga falta | `src/lib/anthropic/mnemotecnia.ts`, `src/app/api/mnemotecnia/route.ts` |
| 8 | yagni | `motor.ts` (`necesitaRefuerzo`, `calcularTipoSiguienteSesion`): sin imports hoy. **Se queda**: la Fase 7 del prompt lo designa como sitio de la lógica común de persistencia del plan | reutilizar en Fase 7 | `src/lib/plan/motor.ts` |

Ninguno cae dentro de una fase del prompt salvo el 8 (Fase 7).

net: -~110 líneas, -7 deps posibles.
