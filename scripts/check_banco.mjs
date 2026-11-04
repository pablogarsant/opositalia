/**
 * Autocomprobación de la elección de tarjetas y preguntas (sin framework de tests).
 * Uso (desde C:\KAIROS\opositalia):  node scripts/check_banco.mjs
 * Sin salida de error = todo correcto.
 */
import assert from "node:assert/strict";
import { elegirItems } from "../src/lib/sesion/seleccion.ts";

const items = ["a", "b", "c", "d"].map((id) => ({ id }));
const ids = (lista) => lista.map((x) => x.id);

// 1. Lo no visto va antes que lo visto
const vistos = new Map([["a", "2026-10-01"], ["b", "2026-09-01"]]);
assert.deepEqual(ids(elegirItems(items, vistos, 2)).sort(), ["c", "d"]);

// 2. Si no alcanza, se completa con lo visto hace más tiempo
assert.deepEqual(ids(elegirItems(items, vistos, 3)).slice(2), ["b"]);
assert.deepEqual(ids(elegirItems(items, vistos, 4)).slice(2), ["b", "a"]);

// 3. Nunca devuelve más de lo que hay ni repite
assert.equal(new Set(ids(elegirItems(items, new Map(), 10))).size, 4);
assert.deepEqual(elegirItems([], vistos, 5), []);

// 4. El orden de lo no visto depende del azar
const conAzar = (valor) => ids(elegirItems(items, new Map(), 4, () => valor));
assert.notDeepEqual(conAzar(0), conAzar(0.99));

// 5. No altera la lista original
const original = [...items];
elegirItems(items, new Map(), 4);
assert.deepEqual(items, original);

console.log("check_banco: OK");
