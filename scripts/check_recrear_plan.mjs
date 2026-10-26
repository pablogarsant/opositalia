/**
 * Autocomprobación de "recrear plan conservando progreso" (sin framework de tests).
 * Uso (desde C:\KAIROS\opositalia):  node scripts/check_recrear_plan.mjs
 * Sin salida de error = todo correcto.
 */
import assert from "node:assert/strict";
import { generarSesiones, replanificar } from "../src/lib/plan/generador.ts";

const bloques = [
  { id: "b1", titulo: "Común", temas: [{ id: "t1", titulo: "T1", horas: 2, parte: "comun" }] },
  { id: "b2", titulo: "Específica", temas: [{ id: "t2", titulo: "T2", horas: 2, parte: "especifica", puntos: 4 }] },
];
const config = { dias_semana: [1, 3, 5], horas_sesion: 2, intensidad: "media" };
const lunes = new Date("2026-10-26T10:00:00");

const completo = generarSesiones({ bloques, config, fechaInicio: lunes });
const hechas = [
  { tema_id: "t1", bloque_id: "b1", tipo: "lectura" },
  { tema_id: "t2", bloque_id: "b2", tipo: "lectura" },
];
const nuevo = replanificar({ bloques, config, fechaInicio: lunes, hechas });

// 1. Las completadas no se repiten y el resto sigue entero
assert.equal(nuevo.length, completo.length - hechas.length);
assert.ok(!nuevo.some((s) => s.tema_id === "t1" && s.tipo === "lectura"));
assert.ok(nuevo.some((s) => s.tema_id === "t1" && s.tipo === "repaso"));

// 2. Empieza hoy (lunes disponible), solo en días disponibles, sin huecos ni días repetidos
assert.equal(nuevo[0].fecha_programada, "2026-10-26");
assert.deepEqual(nuevo.map((s) => s.fecha_programada), completo.slice(0, nuevo.length).map((s) => s.fecha_programada));
for (const s of nuevo) assert.ok([1, 3, 5].includes(new Date(`${s.fecha_programada}T12:00:00`).getDay()));

// 3. Orden recompactado 0..n-1
assert.deepEqual(nuevo.map((s) => s.orden), nuevo.map((_, i) => i));

// 4. Una hecha repetida dos veces solo descuenta lo que existe (no rompe)
assert.equal(replanificar({ bloques, config, fechaInicio: lunes, hechas: [hechas[0], hechas[0]] }).length, completo.length - 1);

console.log("check_recrear_plan: OK");
