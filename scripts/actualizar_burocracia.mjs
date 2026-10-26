/**
 * Actualiza a mano la caché de burocracia (burocracia_cache, fila 'OIR-SAS').
 * La app NUNCA busca en internet: solo lee esta fila y enseña su fecha.
 *
 * Uso (desde C:\KAIROS\opositalia):
 *   node scripts/actualizar_burocracia.mjs --fallback   # guarda DATOS_FALLBACK de src/lib/burocracia.ts (gratis)
 *   node scripts/actualizar_burocracia.mjs --buscar     # busca novedades en SAS/BOJA (~0,3 $, ~65 s);
 *                                                       # guarda solo si valida y hay cambios
 * Escribe en la base de datos de .env.local (producción): lánzalo tú, sabiendo eso.
 */
import { createRequire } from "node:module";

process.loadEnvFile(".env.local");
const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");
// después de cargar el .env: client.ts lee ANTHROPIC_API_KEY al importarse
const { DATOS_FALLBACK, datosSchema, hashDatos, buscarConvocatoria, ENLACE_SAS } = await import("../src/lib/burocracia.ts");

const modo = process.argv[2];
if (modo !== "--fallback" && modo !== "--buscar") {
  console.log("Uso: node scripts/actualizar_burocracia.mjs --fallback | --buscar (~0,3 $)");
  process.exit(1);
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const fila = await sb.from("burocracia_cache").select("id, datos, hash_contenido, updated_at").eq("convocatoria", "OIR-SAS").maybeSingle();
if (fila.error) throw new Error(`burocracia_cache: ${fila.error.message}`);
const actualesValidos = fila.data ? datosSchema.safeParse(fila.data.datos) : null;
const actuales = actualesValidos?.success ? actualesValidos.data : DATOS_FALLBACK;
console.log(`Caché actual: ${fila.data ? `actualizada ${fila.data.updated_at}${actualesValidos?.success ? "" : " (forma antigua)"}` : "no existe"}`);

let nuevos = DATOS_FALLBACK;
if (modo === "--buscar") {
  const { anthropic, MODEL } = await import("../src/lib/anthropic/client.ts");
  const t0 = Date.now();
  const r = await buscarConvocatoria(anthropic, MODEL, actuales);
  const u = r.usage;
  // Sonnet 4.6: 3 $/M entrada, 15 $/M salida, 0,01 $ por búsqueda web
  const coste = u ? (u.input_tokens * 3 + u.output_tokens * 15) / 1e6 + (u.server_tool_use?.web_search_requests ?? 0) * 0.01 : 0;
  console.log(`Búsqueda: ${((Date.now() - t0) / 1000).toFixed(1)} s, ~${coste.toFixed(2)} $`);
  for (const b of r.busquedas ?? []) console.log(`  · ${b}`);
  if ("error" in r) {
    console.error(`Fallo, no se guarda nada: ${r.error}`);
    process.exit(1);
  }
  if ("sinNovedades" in r) {
    console.log("Sin novedades: se marca la fecha de comprobación.");
    const up = await sb.from("burocracia_cache").update({ updated_at: new Date().toISOString() }).eq("id", fila.data.id);
    if (up.error) throw new Error(up.error.message);
    process.exit(0);
  }
  nuevos = r.datos;
  console.log(`Estado según la búsqueda: ${nuevos.estado}`);
}

if (fila.data && hashDatos(nuevos) === fila.data.hash_contenido) {
  console.log("Los datos no cambian: solo se marca la fecha.");
}
const valores = {
  datos: nuevos,
  hash_contenido: hashDatos(nuevos),
  fuente_url: ENLACE_SAS,
  updated_at: new Date().toISOString(),
};
const w = fila.data
  ? await sb.from("burocracia_cache").update(valores).eq("id", fila.data.id)
  : await sb.from("burocracia_cache").insert({ convocatoria: "OIR-SAS", fecha_publicacion: null, ...valores });
if (w.error) throw new Error(`No se pudo guardar: ${w.error.message}`);
console.log(`Guardado (${modo === "--fallback" ? "datos curados" : "datos de la búsqueda"}). La página mostrará "Actualizado el ${new Date().toLocaleDateString("es-ES")}".`);
