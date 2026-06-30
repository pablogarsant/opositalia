# OPOSITALIA — Contexto para Claude Code

## Qué es este proyecto
Opositalia es una plataforma SaaS de preparación de oposiciones médicas con IA.
Desarrollada bajo KAIROS/TALOS. Primer curso: OIR 2026 (Oftalmólogo SAS Andalucía).
Primera usuaria: Inma (validación beta, gratis).

## Stack
- **Frontend/Backend**: Next.js App Router + TypeScript + Tailwind
- **Auth**: Clerk (roles: alumno, admin, tutor)
- **Base de datos**: Supabase (PostgreSQL + pgvector para RAG)
- **IA**: Anthropic API — claude-sonnet-4-6
- **Deploy**: Vercel
- **Plataforma**: PWA (web + móvil sin app nativa)

## Convenciones de código
- Componentes: PascalCase, un componente por archivo
- Funciones y variables: camelCase
- Tipos: en /types/, prefijo I para interfaces
- API routes: REST, respuestas { data, error }
- Comentarios: en español
- No crear abstracciones antes de tener 3 usos reales (YAGNI)

## Arquitectura de la sesión de estudio
5 fases secuenciales: Repaso (flashcards SRS) → Conceptos clave → Mapa mental → Lectura con mnemotecnias → Simulacro de examen.
El chatbot IA está disponible en fases 1-4, bloqueado en fase 5.

## Motor de plan
- Ciclo por bloque: Lectura → Repaso → Examen
- Umbral de refuerzo: 65% (por debajo = sesión de refuerzo automática)
- Umbral de avance: 70%
- Reorganización automática si sesión perdida o resultado bajo
- Todo cambio se registra en historial_plan

## Paletas de color
- Cielo: #EEF4FF bg, #2B5BA8 accent
- Salvia: #F0F5F0 bg, #3D7A5E accent
- Arena: #FAF7F2 bg, #8B6F47 accent
- Niebla: #F4F3F8 bg, #6B5EA8 accent
- Noche: #0e1117 bg, #4ade80 accent

## Tipografía
- Display/títulos: Lora (serif)
- Cuerpo/UI: Inter

## Branches
- main: producción (solo via PR)
- develop: integración
- feature/*: funcionalidades nuevas
- hotfix/*: correcciones urgentes

## Estado actual del desarrollo
- [x] Prototipo HTML validado con usuaria beta (Inma)
- [x] Fase 0: Estructura base, schema Supabase, configuración PWA
- [ ] Fase 1: Auth Clerk + middleware + perfil en Supabase
- [ ] Fase 2: Motor de sesión con IA real
- [ ] Fase 3: Plan con persistencia
- [ ] Fase 4: RAG + ingesta documental
- [ ] Fase 5: Beta launch
