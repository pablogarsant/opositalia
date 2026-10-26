# Inventario Fase 1 — Opositalia (2026-10-25)

Auditoría previa sin tocar código. Lecturas de base de datos hechas con `service_role` vía PostgREST desde `.env.local` (ref `zjjhejhybjitstmcbppq`), solo `SELECT`. El MCP de Supabase no estaba cargado en esta sesión (requiere `/mcp`), así que el bloque 2 y el índice de la 0007 quedan para el SQL Editor.

| Elemento | Estado | Evidencia |
|---|---|---|
| `origin/main` | `7671a76` (fase 5) | `git rev-parse origin/main` |
| `origin/develop` | `2a17edb` (merge PR #8) | `git log origin/main..origin/develop` = fase 6 + PR #7 + PR #8 |
| `develop` en `main` | **No** | `git merge-base --is-ancestor origin/develop origin/main` → falso |
| `feature/fase-1…5` | En `develop` y en `main` | `merge-base --is-ancestor` |
| `feature/fase-6-temario-arbol` | En `develop`, no en `main` | ídem |
| `fix/rag-reingesta-indice` | En `develop`, no en `main` | ídem |
| `feature/fase-7-lectura-grafo-chat` (`e3f2f92`) | **Ni en `develop` ni en `main`**. Su padre es `5ef7dc2`, así que ya contiene el fix RAG | ídem + `git log` |
| `feature/ingesta-master` (local) | = `5ef7dc2`, sin remoto; redundante con `fix/rag-reingesta-indice` | `git branch -vv` |
| `develop` local | 2 commits por detrás de `origin/develop` | `git branch -vv` |
| `master` (local) | Commit inicial de create-next-app; residuo | `git branch -vv` |
| Producción Vercel | `dpl_2sQ2uueD1jMeJUbPSFWd44dowH1Q` (`opositalia-dhyo2w4sq`), Ready, 13 jul 2026 20:45, alias `opositalia.vercel.app`. Sin cambios desde la redacción del prompt | `vercel ls` / `vercel inspect --scope team_7PuowqAGF6pzjNx2Reeh1TfZ` |
| Commit desplegado | `341e4c8` según el prompt; el despliegue por CLI no guarda metadatos Git, no se puede confirmar desde Vercel | `vercel inspect` (sin bloque Git) |
| Migraciones 0001–0006 | Aplicadas | columnas/tablas/`rpc('mi_perfil_id')` responden |
| Migración 0007 | No comprobable por PostgREST (índice) | pendiente bloque 1 en SQL Editor |
| Migración 0008 | **No aplicada** | `contenido_formateado` y `relaciones_temas`: `404 Could not find the table … in the schema cache` |
| Ficheros sin commitear | `scripts/rag/ingest_master.py` (ingesta del máster con `--archivos-desde`/`--rehacer`), `scripts/rag/pendientes_refractiva.txt` (9 PDFs fallidos), `supabase/scripts/01_auditoria_estado.sql` (solo lectura), `supabase/scripts/02_borrar_cuentas.sql` (borrado de usuario), `docs/prompts/fase-8-auditoria.md` (este prompt). Fuera del commit: `.mcp.json` (config local del MCP, sin secretos) y `.claude/settings.local.json` (local) | `git status --porcelain` |
| `git stash` | Vacío | `git stash list` |
| Corpus | 24.015 chunks, 217 documentos. Bloque "Traumatología ocular" con 0 chunks | `count` en `chunks_rag`/`documentos`; `04_verify_rag.py` |
| Refractiva (9 PDFs fallidos) | **8 con 0 chunks**, **1 parcial**: `Defectos-refractivos-y-Cirugia-refractiva_PPP.pdf` 40 chunks hasta pág. 40 de 199 | `chunks_rag` por `documento_id` + nº de páginas con PyMuPDF |
| Datos de usuario | perfiles 8, inscripciones 5, sesiones_plan 1.424, historial_plan 1, sesiones_estudio 3, respuestas_examen 30, progreso_temas 535; progreso_puntos, favoritos, notas, rachas 0 | `count` por tabla |
| `sesion_cache` | 9 filas | `count` |
| `burocracia_cache` | 1 fila `OIR-SAS`, `updated_at` 2026-09-16, `fecha_examen` "Pendiente de publicación (2026)" | `select` |
| Calidad fase 7 | `tsc` OK, `lint` OK, `build` OK | salida de los tres comandos |
| Calidad `develop` | `lint` OK, `build` OK. `tsc`: `.next/types/validator.ts(143,39): error TS2307: Cannot find module '../../src/app/(dashboard)/temario/[temaId]/page.js'` | tipos de `.next` generados por el build de fase 7; hipótesis: artefacto, no error de código |

## Observado vs hipótesis

- Observado: `rachas` = 0 con 8 perfiles. El webhook `user.created` debería crear `rachas` (ver Fase 2).
- Observado: 8 perfiles pero 5 inscripciones.
- Hipótesis: el error de `tsc` en `develop` desaparece con `rm -rf .next` antes de `tsc`. No verificado.

No verificado: commit exacto de producción, índice 0007, bloque 2 (FK a `perfiles`), bloques 4/4b/4c.

Auditoría de sobreingeniería: [auditoria-ponytail.md](auditoria-ponytail.md).
