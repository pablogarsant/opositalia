/**
 * Aristas temáticas del grafo del temario: qué temas comparten conceptos.
 *
 * Mezcla dos fuentes:
 *  - automática: Jaccard sobre los términos médicos normalizados de cada tema
 *    (título + subtemas + puntos + keywords), con tope de vecinos por tema
 *    para que el grafo no se convierta en una madeja.
 *  - manual: pares evidentes que el solapamiento léxico no detecta
 *    (p. ej. retinopatía diabética ↔ glaucoma neovascular).
 *
 * Idempotente. Requiere la migración 0008 aplicada.
 * Uso:  npx tsx scripts/generar_relaciones_temas.ts [--dry-run]
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const UMBRAL = 0.07; // Jaccard mínimo para considerar que dos temas se tocan // Jaccard mínimo para considerar que dos temas se tocan // Jaccard mínimo para considerar que dos temas se tocan // Jaccard mínimo para considerar que dos temas se tocan
const MAX_VECINOS = 6; // aristas automáticas por tema
const MIN_LONGITUD = 5; // términos más cortos son ruido ("ojo", "vía", "test")

// palabras que aparecen en medio temario y no dicen nada del contenido
const STOPWORDS = new Set([
  "sobre","para","como","desde","entre","segun","cuando","donde","mediante","ademas",
  "concepto","conceptos","definicion","definiciones","clasificacion","clasificaciones",
  "diagnostico","diagnosticos","tratamiento","tratamientos","clinica","clinicas","clinico",
  "manejo","estudio","estudios","general","generales","principios","tipos","formas",
  "paciente","pacientes","enfermedad","enfermedades","patologia","patologias","sindrome",
  "exploracion","tecnica","tecnicas","metodo","metodos","procedimiento","procedimientos",
  "indicaciones","complicaciones","pronostico","etiologia","epidemiologia","fisiopatologia",
  "anatomia","fisiologia","ocular","oculares","oftalmologia","oftalmologico","oftalmologica",
  "otras","otros","nuevas","nuevos","principales","distintos","diferentes","aspectos",
  "introduccion","generalidades","exploraciones","pruebas","prueba","sistema","sistemas",
  // ruido de la Parte Comun: aparece en casi todos los temas de legislacion
  "salud","andalucia","sanitaria","sanitario","sanitarios","publica","publico","junta",
  "profesional","profesionales","derecho","derechos","servicio","servicios","atencion",
  "gestion","calidad","modelo","competencias","informacion","comunicacion","consejo",
  "objeto","basicos","basicas","areas","organizacion","normativa","legislacion",
  // ruido anatomico: demasiado generico para inferir relacion tematica
  "anterior","posterior","segmento","capas","criterios","globo","estructuras",
]);

/** Pares evidentes por número BOJA: [tema A, tema B, motivo]. */
/**
 * Pares evidentes por numero BOJA (verificados contra los titulos reales del
 * temario), con el motivo escrito a mano: el solapamiento lexico no los ve.
 */
const MANUALES: [number, number, string][] = [
  // vasculo-retina y sistemicas
  [76, 96, "retinopatía diabética y manifestaciones oculares de la diabetes"],
  [73, 76, "glaucoma neovascular secundario a retinopatía diabética"],
  [76, 77, "retinopatía diabética y resto de patología vascular retiniana"],
  [76, 86, "láser e inyecciones intravítreas en retinopatía diabética"],
  [82, 86, "antiangiogénicos intravítreos en la DMAE"],
  [90, 94, "neuropatía óptica isquémica y arteritis de células gigantes"],
  [95, 96, "manifestaciones oculares de enfermedades sistémicas"],
  [41, 96, "orbitopatía tiroidea: órbita y patología endocrina"],
  [64, 97, "uveítis posterior de origen infeccioso sistémico"],
  // uveítis
  [61, 62, "clasificación de las uveítis y uveítis anterior"],
  [62, 63, "uveítis anterior e intermedia"],
  [63, 64, "uveítis intermedia y posterior"],
  [61, 65, "clasificación de las uveítis, panuveítis y endoftalmitis"],
  // glaucoma
  [70, 71, "diagnóstico del glaucoma y glaucoma primario de ángulo abierto"],
  [71, 72, "glaucoma primario de ángulo abierto y por cierre angular"],
  [72, 73, "cierre angular y glaucomas secundarios"],
  [35, 36, "glaucomas primarios y secundarios en la infancia"],
  // neuroftalmología
  [90, 91, "patología y tumores del nervio óptico"],
  [90, 92, "nervio óptico y síndromes quiasmáticos"],
  [88, 93, "pupila y parálisis de pares craneales"],
  // óptica y refracción
  [27, 28, "óptica geométrica y ametropías"],
  [28, 29, "ametropías y su corrección óptica"],
  [29, 30, "corrección óptica y lentes de contacto"],
  [30, 31, "lentes de contacto y cirugía refractiva"],
  [31, 32, "cirugía refractiva I y II"],
  // cristalino
  [66, 67, "anomalías del cristalino y cataratas"],
  [67, 68, "catarata y su cirugía"],
  // superficie ocular
  [45, 49, "superficie ocular y ojo seco"],
  [49, 50, "ojo seco y síndromes secos especiales"],
  [53, 54, "infecciones de la superficie y queratitis infecciosas"],
  [57, 58, "cirugía de la superficie ocular I y II"],
  [59, 60, "epiescleritis y escleritis"],
  // retina quirúrgica
  [83, 84, "interfase vítreo-macular y desprendimiento de retina"],
  [80, 84, "miopía patológica y desprendimiento de retina"],
  [75, 81, "anomalías hereditarias de retina y distrofias retinianas"],
  // pediatría
  [33, 34, "oftalmología pediátrica I y II"],
  [33, 39, "oftalmología pediátrica y leucocorias"],
  [37, 38, "estrabismos y otros trastornos oculomotores"],
  // órbita, anejos y traumatismos
  [42, 102, "párpados y traumatismos de órbita y anejos"],
  [44, 102, "vías lacrimales y traumatismo de los anejos"],
  [40, 41, "anatomía de la órbita y patología orbitaria"],
  [101, 103, "traumatismos oculares y globo cerrado"],
  [101, 104, "traumatismos oculares y globo abierto"],
  [103, 104, "traumatismo con globo cerrado y con globo abierto"],
  [105, 107, "traumatismo no mecánico y toxicología ocular"],
];

function cargarEnvLocal(): void {
  const ruta = join(process.cwd(), ".env.local");
  for (const linea of readFileSync(ruta, "utf-8").split("\n")) {
    const m = linea.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

/** minúsculas sin acentos, solo letras. */
function normalizar(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= MIN_LONGITUD && !STOPWORDS.has(t));
}

function jaccard(a: Set<string>, b: Set<string>): { valor: number; comunes: string[] } {
  const comunes = [...a].filter((t) => b.has(t));
  const union = new Set([...a, ...b]).size;
  return { valor: union ? comunes.length / union : 0, comunes };
}

async function main(): Promise<void> {
  cargarEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan claves de Supabase en .env.local");
  const dryRun = process.argv.includes("--dry-run");
  const sb = createClient(url, key);

  if (!dryRun) {
    const check = await sb.from("relaciones_temas").select("id").limit(1);
    if (check.error) {
      throw new Error(
        `Falta la tabla relaciones_temas — aplica supabase/migrations/0008_lectura_grafo.sql (${check.error.message})`
      );
    }
  }

  const [temas, subtemas, puntos] = await Promise.all([
    sb.from("temas").select("id, titulo, numero_boja, parte, bloque_id").order("numero_boja"),
    sb.from("subtemas").select("id, tema_id, titulo"),
    sb.from("puntos").select("id, subtema_id, titulo, keywords"),
  ]);
  if (temas.error || subtemas.error || puntos.error) {
    throw new Error(temas.error?.message ?? subtemas.error?.message ?? puntos.error!.message);
  }

  const temaDeSubtema = new Map<string, string>();
  for (const s of subtemas.data ?? []) if (s.tema_id) temaDeSubtema.set(s.id, s.tema_id);

  // bolsa de términos por tema
  const terminos = new Map<string, Set<string>>();
  const anadir = (temaId: string | null, texto: string) => {
    if (!temaId) return;
    if (!terminos.has(temaId)) terminos.set(temaId, new Set());
    for (const t of normalizar(texto)) terminos.get(temaId)!.add(t);
  };
  for (const t of temas.data ?? []) anadir(t.id, t.titulo);
  for (const s of subtemas.data ?? []) anadir(s.tema_id, s.titulo);
  for (const p of puntos.data ?? []) {
    const temaId = temaDeSubtema.get(p.subtema_id) ?? null;
    anadir(temaId, p.titulo);
    anadir(temaId, (p.keywords ?? []).join(" "));
  }

  const lista = (temas.data ?? []).filter((t) => terminos.has(t.id));
  console.log(`${lista.length} temas con términos; calculando solapamientos…`);

  // candidatas automáticas
  type Arista = { a: string; b: string; peso: number; motivo: string };
  const candidatas = new Map<string, Arista[]>(); // por tema → vecinos ordenados
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const A = lista[i];
      const B = lista[j];
      const { valor, comunes } = jaccard(terminos.get(A.id)!, terminos.get(B.id)!);
      if (valor < UMBRAL) continue;
      const motivo = `comparten: ${comunes.slice(0, 3).join(", ")}`;
      const arista: Arista = { a: A.id, b: B.id, peso: Math.min(0.99, valor), motivo };
      for (const id of [A.id, B.id]) {
        const arr = candidatas.get(id) ?? [];
        arr.push(arista);
        candidatas.set(id, arr);
      }
    }
  }

  const finales = new Map<string, Arista>();
  const clave = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  for (const [, vecinos] of candidatas) {
    for (const arista of vecinos.sort((x, y) => y.peso - x.peso).slice(0, MAX_VECINOS)) {
      finales.set(clave(arista.a, arista.b), arista);
    }
  }
  const automaticas = finales.size;

  // manuales: pisan a las automáticas (el motivo escrito a mano es mejor)
  const porNumero = new Map<number, string>();
  for (const t of temas.data ?? []) if (t.numero_boja) porNumero.set(t.numero_boja, t.id);
  let manualesOk = 0;
  const sinMapear: number[] = [];
  for (const [na, nb, motivo] of MANUALES) {
    const a = porNumero.get(na);
    const b = porNumero.get(nb);
    if (!a || !b) {
      sinMapear.push(!a ? na : nb);
      continue;
    }
    finales.set(clave(a, b), { a, b, peso: 0.9, motivo });
    manualesOk++;
  }

  const filas = [...finales.values()].map((r) => ({
    tema_a_id: r.a < r.b ? r.a : r.b,
    tema_b_id: r.a < r.b ? r.b : r.a,
    peso: Number(r.peso.toFixed(2)),
    motivo: r.motivo.slice(0, 200),
  }));

  console.log(
    `${filas.length} relaciones (${automaticas} automáticas tras el tope de ${MAX_VECINOS} vecinos, ${manualesOk} manuales)`
  );
  if (sinMapear.length) console.warn(`Temas manuales sin numero_boja en BD: ${sinMapear.join(", ")}`);
  if (dryRun) {
    const titulo = new Map((temas.data ?? []).map((t) => [t.id, `${t.numero_boja ?? "?"}. ${t.titulo}`]));
    for (const f of filas) {
      console.log(
        `${f.peso}  ${titulo.get(f.tema_a_id)?.slice(0, 44)} ↔ ${titulo.get(f.tema_b_id)?.slice(0, 44)}  (${f.motivo})`
      );
    }
    return;
  }

  await sb.from("relaciones_temas").delete().neq("tema_a_id", "00000000-0000-0000-0000-000000000000");
  for (let i = 0; i < filas.length; i += 200) {
    const lote = filas.slice(i, i + 200);
    const r = await sb.from("relaciones_temas").upsert(lote, { onConflict: "tema_a_id,tema_b_id" });
    if (r.error) throw new Error(r.error.message);
  }
  console.log(`✓ ${filas.length} relaciones guardadas en relaciones_temas`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
