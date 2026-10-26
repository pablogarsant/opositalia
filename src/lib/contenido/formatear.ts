import type { ChunkRAG } from "@/lib/rag";

export interface Fuente {
  documento: string;
  pagina?: string;
  // chunks literales de esta fuente: el visor los abre por id (Fase 8)
  chunk_ids?: string[];
}

interface MetaChunk {
  libro?: string;
  libro_titulo?: string;
  titulo?: string;
  capitulo?: number;
  capitulo_titulo?: string;
  paginas?: [number, number] | number[];
  chunk_index?: number;
}

const SEPARADOR = /^[\s|+_=–—-]{3,}$/; // línea de guiones/pipes: separador de tabla o regla
// puntos guía de un índice de PDF: "Geriatría . . . . . . . . 193"
// (el extractor deja ".  .  .  ." con espacios variables entre puntos)
const GUIA_INDICE = /(\.[ \t]*){4,}|(…[ \t]*){2,}/;
// los PDFs usan cuadraditos y rombos además de bolos; si no se reconocen,
// las viñetas acaban detectadas como columnas de tabla
const VINETA = /^\s*[•·▪▫■□◦‣◆◇●○*▶►>–—-]\s+/;
const ORDINAL = /^\s*(\d{1,2})[.)]\s+/;

// ── 1. Orden y unión ────────────────────────────────────────

function meta(c: ChunkRAG): MetaChunk {
  return (c.metadata ?? {}) as MetaChunk;
}

/** Orden del documento original: libro → capítulo → chunk_index. */
export function ordenarChunks(chunks: ChunkRAG[]): ChunkRAG[] {
  return [...chunks].sort((a, b) => {
    const ma = meta(a);
    const mb = meta(b);
    const libro = (ma.libro ?? "").localeCompare(mb.libro ?? "");
    if (libro !== 0) return libro;
    if ((ma.capitulo ?? 0) !== (mb.capitulo ?? 0)) return (ma.capitulo ?? 0) - (mb.capitulo ?? 0);
    return (ma.chunk_index ?? 0) - (mb.chunk_index ?? 0);
  });
}

const clave = (p: string) =>
  p
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü]+/g, "")
    .slice(0, 120);

/**
 * Une los chunks quitando el solapamiento. El chunker solapa párrafos enteros
 * (pipeline.py `_cola_overlap`), así que deduplicar por párrafo es exacto.
 */
export function unirSinSolapes(chunks: ChunkRAG[]): string {
  const vistos = new Set<string>();
  const salida: string[] = [];
  let libroPrevio: string | null = null;
  for (const c of ordenarChunks(chunks)) {
    // el RAG mezcla libros: una regla separa el bloque de cada fuente
    const libro = meta(c).libro ?? null;
    if (libroPrevio !== null && libro !== libroPrevio) salida.push("---");
    libroPrevio = libro;
    for (const parrafo of c.contenido.split(/\n{2,}/)) {
      const t = parrafo.trim();
      if (!t) continue;
      const k = clave(t);
      if (k.length > 12 && vistos.has(k)) continue;
      vistos.add(k);
      salida.push(t);
    }
  }
  return salida.join("\n\n");
}

// ── 2. Artefactos de extracción de PDF ──────────────────────

/** ¿Es una línea que solo lleva el número/cabecera de página del PDF? */
function esNumeroDePagina(linea: string): boolean {
  const t = linea.trim();
  if (!t) return false;
  if (/^\d{1,4}$/.test(t)) return true;
  if (/^(p[áa]g(ina)?\.?\s*)?\d{1,4}\s*(\/|de)\s*\d{1,4}$/i.test(t)) return true;
  // cabeceras/pies: "412 · CAPÍTULO 9", "CAPÍTULO 17: Radiología ● 487"
  const sep = "[|·•●○—–-]";
  if (new RegExp(`^\\d{1,4}\\s*${sep}\\s*\\S.{0,80}$`).test(t)) return true;
  if (new RegExp(`^\\S.{0,80}?\\s*${sep}\\s*\\d{1,4}$`).test(t) && !/[.:;,]$/.test(t)) return true;
  return false;
}

export function limpiarArtefactos(texto: string): string {
  return (
    texto
      // guion de corte de palabra al final de línea: re-unir
      .replace(/(\p{Ll})[-‐‑]\s*\n\s*(\p{Ll})/gu, "$1$2")
      // ligaduras y comillas raras que deja la extracción
      .replace(/ﬁ/g, "fi")
      .replace(/ﬂ/g, "fl")
      .replace(/­/g, "")
      .split("\n")
      // fuera números de página y entradas de índice
      .filter((l) => !esNumeroDePagina(l) && !GUIA_INDICE.test(l))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
  // ojo: los espacios múltiples NO se colapsan aquí — son las columnas de las
  // tablas en texto plano. Se colapsan al final, ya convertidas.
}

// ── 3. Tablas ───────────────────────────────────────────────

/** Parte una línea en celdas: primero por pipes, si no por 2+ espacios. */
function celdas(linea: string): string[] {
  const t = linea.trim().replace(/^\||\|$/g, "");
  if (t.includes("|")) return t.split("|").map((c) => c.trim());
  return linea.trim().split(/\s{2,}|\t+/).map((c) => c.trim()).filter(Boolean);
}

function esFilaTabla(linea: string): boolean {
  if (!linea.trim() || SEPARADOR.test(linea)) return false;
  if (VINETA.test(linea) || ORDINAL.test(linea)) return false;
  // una frase normal no se parte en columnas
  return celdas(linea).length >= 2 && linea.trim().length < 200;
}

function construirTabla(filas: string[][]): string {
  const cols = Math.max(...filas.map((f) => f.length));
  const norm = filas.map((f) => [...f, ...Array(cols - f.length).fill("")]);
  const cabecera = norm[0];
  const cuerpo = norm.slice(1);
  const linea = (f: string[]) => `| ${f.map((c) => c.replace(/\|/g, "\\|")).join(" | ")} |`;
  return [linea(cabecera), `|${" --- |".repeat(cols)}`, ...cuerpo.map(linea)].join("\n");
}

/**
 * Convierte bloques tabulares en texto plano (pipes, o columnas separadas por
 * 2+ espacios con su línea de guiones) en tablas markdown GFM reales.
 * Este es el arreglo de "las tablas salen rotas en guiones".
 */
export function detectarTablas(texto: string): string {
  const lineas = texto.split("\n");
  const salida: string[] = [];
  let i = 0;

  while (i < lineas.length) {
    if (!esFilaTabla(lineas[i])) {
      salida.push(lineas[i]);
      i++;
      continue;
    }
    // acumula el bloque: filas + posible separador de cabecera
    const bloque: string[][] = [];
    let j = i;
    let separadorEn = -1;
    while (j < lineas.length) {
      if (SEPARADOR.test(lineas[j]) && bloque.length > 0) {
        if (separadorEn === -1) separadorEn = bloque.length;
        j++;
        continue;
      }
      if (!esFilaTabla(lineas[j])) break;
      bloque.push(celdas(lineas[j]));
      j++;
    }

    const anchos = new Set(bloque.map((f) => f.length));
    // tabla de verdad: 2+ filas y columnas consistentes (o un separador que lo confirma)
    const esTabla = bloque.length >= 2 && (anchos.size === 1 || separadorEn > 0);
    if (esTabla) {
      salida.push("", construirTabla(bloque), "");
      i = j;
    } else {
      salida.push(lineas[i]);
      i++;
    }
  }
  return salida.join("\n");
}

// ── 4. Listas y títulos ─────────────────────────────────────

export function normalizarListas(texto: string): string {
  return texto
    .split("\n")
    .map((l) => {
      if (l.trim().startsWith("|")) return l; // no tocar tablas ya formadas
      if (VINETA.test(l)) return l.replace(VINETA, "- ");
      if (ORDINAL.test(l)) return l.replace(ORDINAL, "$1. ");
      return l;
    })
    .join("\n");
}

function esTitulo(linea: string): boolean {
  const t = linea.trim();
  if (t.length < 3 || t.length > 90) return false;
  if (t.startsWith("|") || t.startsWith("-") || t.startsWith("#")) return false;
  if (/[.;:,]$/.test(t)) return false;
  const letras = t.replace(/[^\p{L}]/gu, "");
  if (letras.length < 3) return false;
  // TODO EN MAYÚSCULAS, o numerado tipo "1.2 Refracción"
  const mayus = letras === letras.toLocaleUpperCase("es");
  const numerado = /^\d+(\.\d+)*\s+\p{Lu}/u.test(t);
  return mayus || numerado;
}

export function detectarTitulos(texto: string): string {
  const lineas = texto.split("\n");
  return lineas
    .map((l, i) => {
      const solo = (lineas[i - 1] ?? "").trim() === "" || i === 0;
      return solo && esTitulo(l) ? `## ${l.trim().replace(/^\d+(\.\d+)*\s+/, "")}` : l;
    })
    .join("\n");
}

/** Une los saltos de línea que el PDF metió dentro de un mismo párrafo. */
export function unirParrafos(texto: string): string {
  const bloques = texto.split(/\n{2,}/);
  return bloques
    .map((b) => {
      const lineas = b.split("\n");
      const estructural = (l: string) =>
        l.trim().startsWith("|") || l.trim().startsWith("#") || /^\s*(-|\d+\.)\s/.test(l);
      if (lineas.some(estructural)) return b; // tablas, listas y títulos conservan sus saltos
      return lineas.map((l) => l.trim()).filter(Boolean).join(" ");
    })
    .join("\n\n");
}

// ── 5. API ──────────────────────────────────────────────────

/**
 * Chunks del RAG → markdown limpio y legible (tablas GFM reales, listas,
 * títulos y párrafos sin los saltos del PDF).
 */
export function formatearContenido(chunks: ChunkRAG[]): string {
  if (!chunks.length) return "";
  let md = unirSinSolapes(chunks);
  md = limpiarArtefactos(md);
  md = detectarTablas(md);
  md = normalizarListas(md);
  md = detectarTitulos(md);
  md = unirParrafos(md);
  return md
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Fuentes citables (documento + páginas) de los chunks usados. */
export function fuentesDeChunks(chunks: ChunkRAG[]): Fuente[] {
  const vistas = new Map<string, Fuente>();
  for (const c of ordenarChunks(chunks)) {
    const m = meta(c);
    const documento =
      m.capitulo_titulo ??
      m.libro_titulo ??
      m.titulo ??
      (m.libro ? m.libro.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ") : "Temario");
    const pagina = Array.isArray(m.paginas) ? `pp. ${m.paginas[0]}–${m.paginas[1]}` : undefined;
    const k = `${documento}|${pagina ?? ""}`;
    if (!vistas.has(k)) vistas.set(k, { documento, pagina, chunk_ids: [] });
    if (c.id) vistas.get(k)!.chunk_ids!.push(c.id);
  }
  return [...vistas.values()];
}

/**
 * ¿El limpiado determinista se ha quedado corto? Entonces vale la pena pagar
 * una llamada a Claude (se cachea, así que se paga una vez por punto).
 */
export function necesitaIA(md: string): boolean {
  if (md.length < 200) return true;
  const lineas = md.split("\n").filter((l) => l.trim());
  if (!lineas.length) return true;
  // pipes sueltos que no llegaron a ser tabla
  const pipesHuerfanos = lineas.filter((l) => l.includes("|") && !l.trim().startsWith("|")).length;
  // restos de reglas de guiones; no cuentan ni el separador GFM de una tabla
  // válida ni el "---" que separa fuentes
  const guiones = lineas.filter(
    (l) => l.trim() !== "---" && !l.trim().startsWith("|") && SEPARADOR.test(l)
  ).length;
  // fragmentación: muchas líneas cortas sueltas = el PDF sigue mandando
  const cortas = lineas.filter(
    (l) => l.trim().length < 35 && !/^[#|-]/.test(l.trim())
  ).length;
  // restos de índice del PDF
  const indices = lineas.filter((l) => GUIA_INDICE.test(l)).length;
  return pipesHuerfanos > 0 || guiones > 0 || indices > 0 || cortas / lineas.length > 0.35;
}
