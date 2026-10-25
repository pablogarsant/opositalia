/**
 * Autocomprobación de la selección de "Sesión de hoy" (sin framework de tests).
 * Uso (desde C:\KAIROS\opositalia):  node scripts/check_sesion_actual.mjs
 * Sin salida de error = todo correcto.
 */
import assert from "node:assert/strict";
import { elegirSesionActual, hoyMadrid } from "../src/lib/plan/sesion-actual.ts";

const s = (id, fecha_programada, orden, estado = "pendiente") => ({ id, fecha_programada, orden, estado });
const elegir = (sesiones, hoy = "2026-10-25") => elegirSesionActual(sesiones, hoy)?.id ?? null;

// 1. Varias hoy: gana la de menor orden, aunque llegue desordenada
assert.equal(elegir([s("b", "2026-10-25", 2), s("a", "2026-10-25", 1)]), "a");

// 2. Sin sesión hoy: la siguiente pendiente, no la atrasada
assert.equal(elegir([s("ayer", "2026-10-24", 0), s("manana", "2026-10-26", 5), s("luego", "2026-10-28", 1)]), "manana");

// 3. La completada de hoy no cuenta: pasa a la siguiente
assert.equal(elegir([s("hecha", "2026-10-25", 0, "completada"), s("sig", "2026-10-25", 1)]), "sig");
assert.equal(elegir([s("hecha", "2026-10-25", 0, "completada"), s("perdida", "2026-10-26", 1, "perdida")]), null);

// 4. orden null va detrás de cualquier orden numérico
assert.equal(elegir([s("sin", "2026-10-25", null), s("con", "2026-10-25", 9)]), "con");

// 5. Madrid, no UTC: 23:30 UTC del 25/10 (CET) ya es 26/10 en Madrid; 23:30 UTC del 24/7 (CEST) ya es 25/7
assert.equal(hoyMadrid(new Date("2026-10-25T23:30:00Z")), "2026-10-26");
assert.equal(hoyMadrid(new Date("2026-07-24T23:30:00Z")), "2026-07-25");

console.log("check_sesion_actual: OK");
