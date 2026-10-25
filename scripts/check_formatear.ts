/**
 * Autocomprobación del formateador de contenido (sin framework de tests).
 * Uso:  npx tsx scripts/check_formatear.ts
 */
import assert from "node:assert/strict";
import {
  formatearContenido,
  fuentesDeChunks,
  necesitaIA,
} from "../src/lib/contenido/formatear";

type Chunk = { contenido: string; metadata: Record<string, unknown>; score: number };

const chunk = (contenido: string, metadata: Record<string, unknown> = {}): Chunk => ({
  contenido,
  metadata: { libro: "kanski.pdf", capitulo: 1, chunk_index: 0, ...metadata },
  score: 0.9,
});

// 1. Tabla rota en guiones y columnas → tabla markdown GFM real
const crudo = `INDICES DE REFRACCION

El índice de refracción de un medio es el cociente entre la velocidad de la luz en el vacío
y su velocidad en ese medio, y determina cuánto se desvía un rayo al atravesar la interfase
entre dos medios contiguos del sistema óptico ocular.

Medio        Índice      Aprox.
---------    --------    -------
Vacío        1,00000     exacto
Córnea       1,376       1,37
Humor acuoso  1,336      1,33`;
const md = formatearContenido([chunk(crudo)]);
assert.match(md, /\| Medio \| Índice \| Aprox\. \|/, "cabecera de tabla no generada");
assert.match(md, /\|\s*---\s*\|/, "falta el separador GFM de la tabla");
assert.match(md, /\| Córnea \| 1,376 \| 1,37 \|/, "fila de tabla perdida");
assert.match(md, /^## INDICES DE REFRACCION$/m, "título en mayúsculas no convertido");
assert.doesNotMatch(md, /^-{3,}$/m, "queda una regla de guiones suelta");

// 2. Artefactos de PDF: número de página, corte de palabra y salto dentro del párrafo
const sucio = `La refracción es el cambio de dirección que sufre un
rayo de luz al atravesar la super-
ficie entre dos medios de distinto índice.

412`;
const limpio = formatearContenido([chunk(sucio)]);
assert.match(limpio, /superficie/, "no se reunió la palabra cortada por guion");
assert.match(limpio, /atravesar la superficie entre/, "no se unieron los saltos del párrafo");
assert.doesNotMatch(limpio, /\b412\b/, "el número de página sigue ahí");

// 3. Solapamiento de chunking: el párrafo repetido aparece una sola vez
const comun = "El cristalino aporta unas 20 dioptrías al sistema óptico del ojo.";
const unidos = formatearContenido([
  chunk(`Primer bloque de texto sobre la óptica ocular.\n\n${comun}`, { chunk_index: 0 }),
  chunk(`${comun}\n\nSegundo bloque sobre la acomodación del cristalino.`, { chunk_index: 1 }),
]);
assert.equal(unidos.split("20 dioptrías").length - 1, 1, "el solapamiento no se dedujo");
assert.match(unidos, /Segundo bloque/, "se perdió contenido del segundo chunk");

// 4. Viñetas heterogéneas → lista markdown
const lista = formatearContenido([
  chunk("Signos:\n\n• Miosis\n· Ptosis\n▪ Anhidrosis\n■ Enoftalmos aparente"),
]);
assert.match(lista, /- Miosis/);
assert.match(lista, /- Ptosis/);
assert.match(lista, /- Anhidrosis/);
assert.match(lista, /- Enoftalmos aparente/, "viñeta ■ no normalizada (acabaría como tabla falsa)");
assert.doesNotMatch(lista, /^\|/m, "una lista de viñetas no debe convertirse en tabla");

// 5. Orden por chunk_index aunque lleguen desordenados (el RAG ordena por score)
const ordenado = formatearContenido([
  chunk("Tercer apartado del capítulo con su contenido propio.", { chunk_index: 2 }),
  chunk("Primer apartado del capítulo con su contenido propio.", { chunk_index: 0 }),
]);
assert.ok(
  ordenado.indexOf("Primer apartado") < ordenado.indexOf("Tercer apartado"),
  "los chunks no se ordenaron por posición en el documento"
);

// 6. Fuentes
const fuentes = fuentesDeChunks([
  chunk("x", { capitulo_titulo: "Óptica clínica", paginas: [1, 40] }),
  chunk("y", { capitulo_titulo: "Óptica clínica", paginas: [1, 40] }),
  chunk("z", { libro: "BCSC_03_Clinical_Optics.pdf", capitulo: 2 }),
]);
assert.equal(fuentes.length, 2, "las fuentes duplicadas no se colapsaron");
assert.equal(fuentes.find((f) => f.documento === "Óptica clínica")?.pagina, "pp. 1–40");
assert.ok(
  fuentes.some((f) => f.documento === "BCSC 03 Clinical Optics"),
  "el nombre de fichero no se convirtió en título legible"
);

// 7. necesitaIA: distingue markdown limpio de residuos
assert.equal(necesitaIA(md), false, "una tabla bien formada no debería ir a Claude");
assert.equal(
  necesitaIA("Tabla\nA | B\nC | D\n--------\nx"),
  true,
  "los pipes huérfanos deberían disparar el reformateo con IA"
);



// 8. Entradas de índice de PDF (puntos guía) fuera, y disparan el reformateo con IA
const conIndice = formatearContenido([
  chunk(
    "Contenido\n\nDeterminantes Sociales  .  .  .  .  .  .  . 3\nGeriatría . . . . . . . . . . . . . 193\n\nEl ojo envejecido sufre cambios fisiológicos bien descritos en la literatura."
  ),
]);
assert.doesNotMatch(conIndice, /\. \. \./, "quedan puntos guía de índice");
assert.match(conIndice, /ojo envejecido/, "se perdió el texto útil");

// 9. Chunks de libros distintos quedan separados por una regla
const dosLibros = formatearContenido([
  chunk("Contenido del primer libro sobre la anatomía de la córnea y sus capas.", { libro: "a_kanski.pdf" }),
  chunk("Contenido del segundo libro sobre la misma córnea vista desde la cirugía.", { libro: "b_bcsc.pdf" }),
]);
assert.match(dosLibros, /^---$/m, "no se separaron las fuentes distintas");

console.log("✓ formatear.ts: 10 comprobaciones OK");
