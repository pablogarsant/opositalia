import { z } from "zod";
import { generarContenidoSesion, type Flashcard, type PreguntaExamen } from "@/lib/anthropic/sesion";
import { formatearContexto, searchRag } from "@/lib/rag";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { elegirItems } from "./seleccion";

type Supabase = ReturnType<typeof supabaseAdmin>;
type TipoBanco = "repaso" | "examen";
type Tema = { id: string; titulo: string; bloque: string };
type Item = { id: string; tema_id: string; texto: string; contenido: Record<string, unknown> };

export type TarjetaRepaso = Flashcard & { id: string; tema: string };
export type PreguntaBanco = PreguntaExamen & { id: string };

const LOTE = 10;
const CHUNKS_POR_LOTE = 8;
/**
 * ponytail: tope por tema y tipo, compartido entre alumnas. Acota el gasto total:
 * 107 temas × 3 lotes × 0,12 $ ≈ 38,5 $. Al llegar se reutiliza lo visto hace más tiempo.
 * Subirlo solo si varias alumnas agotan la batería.
 */
const TOPE_POR_TEMA = 30;
const TARJETAS_SESION_ANTERIOR = 8;
const TARJETAS_OTRAS_SESIONES = 3;
const TEMAS_OTRAS_SESIONES = 5;

const esquemas = {
  repaso: z.object({
    pregunta: z.string().min(5).max(2000),
    respuesta: z.string().min(1),
    dificultad: z.union([z.literal(1), z.literal(2), z.literal(3)]).catch(2),
  }),
  examen: z.object({
    enunciado: z.string().min(10).max(2000),
    opciones: z.array(z.string().min(1)).length(4),
    correcta: z.number().int().min(0).max(3),
    explicacion: z.string().min(1),
  }),
};

async function cargarItems(sb: Supabase, temaIds: string[], tipo: TipoBanco): Promise<Item[]> {
  const r = await sb
    .from("banco_items")
    .select("id, tema_id, texto, contenido")
    .in("tema_id", temaIds)
    .eq("tipo", tipo);
  if (r.error) throw new Error(`banco_items: ${r.error.message}`);
  return r.data;
}

async function cargarVistos(sb: Supabase, perfilId: string, itemIds: string[]): Promise<Map<string, string>> {
  if (!itemIds.length) return new Map();
  const r = await sb.from("items_vistos").select("item_id, visto_en").eq("perfil_id", perfilId).in("item_id", itemIds);
  if (r.error) throw new Error(`items_vistos: ${r.error.message}`);
  return new Map(r.data.map((v) => [v.item_id, v.visto_en]));
}

/** Genera un lote nuevo (de pago) y lo guarda. Cada lote usa otros fragmentos del temario. */
async function generarLote(sb: Supabase, tema: Tema, tipo: TipoBanco, existentes: Item[]): Promise<Item[]> {
  const lote = Math.floor(existentes.length / LOTE);
  const consulta = `${tema.titulo} ${tema.bloque}`;
  const pedidos = CHUNKS_POR_LOTE * (lote + 1);
  // el bloque grueso del temario puede no casar con el bloque fino de los chunks
  let chunks = await searchRag(consulta, tema.bloque, pedidos);
  if (chunks.length < 3) chunks = await searchRag(consulta, null, pedidos);
  const ventana = chunks.slice(CHUNKS_POR_LOTE * lote);
  const contexto = formatearContexto(ventana.length ? ventana : chunks.slice(0, CHUNKS_POR_LOTE));

  const generado = (await generarContenidoSesion(
    tipo,
    tema.titulo,
    tema.bloque,
    contexto,
    existentes.map((i) => i.texto)
  )) as { flashcards?: unknown[]; preguntas?: unknown[] };

  const crudos = (tipo === "repaso" ? generado.flashcards : generado.preguntas) ?? [];
  const filas = crudos.flatMap((crudo) => {
    const valido = esquemas[tipo].safeParse(crudo);
    if (!valido.success) return [];
    const texto = "pregunta" in valido.data ? valido.data.pregunta : valido.data.enunciado;
    return [{ tema_id: tema.id, tipo, texto, contenido: valido.data as Record<string, unknown> }];
  });
  if (!filas.length) throw new Error(`Lote ${tipo} de "${tema.titulo}" sin items válidos`);

  const r = await sb
    .from("banco_items")
    .upsert(filas, { onConflict: "tema_id,tipo,texto", ignoreDuplicates: true })
    .select("id, tema_id, texto, contenido");
  if (r.error) throw new Error(`banco_items insert: ${r.error.message}`);
  return r.data;
}

/**
 * Items de un tema para una alumna. Solo genera si no le quedan `n` sin ver y el
 * tema no ha llegado al tope. Si generar falla (p. ej. sin saldo) y ya hay material,
 * la sesión sigue con lo existente.
 */
async function itemsDeTema(sb: Supabase, perfilId: string, tema: Tema, tipo: TipoBanco, n: number): Promise<Item[]> {
  let items = await cargarItems(sb, [tema.id], tipo);
  const vistos = await cargarVistos(sb, perfilId, items.map((i) => i.id));
  const sinVer = items.filter((i) => !vistos.has(i.id)).length;
  if (sinVer < n && items.length < TOPE_POR_TEMA) {
    try {
      items = [...items, ...(await generarLote(sb, tema, tipo, items))];
    } catch (e) {
      if (!items.length) throw e;
      console.error(`banco ${tipo} tema=${tema.id}: se reutiliza lo existente:`, e instanceof Error ? e.message : e);
    }
  }
  return elegirItems(items, vistos, n);
}

/** Las 10 preguntas del simulacro. */
export async function preguntasDeExamen(perfilId: string, tema: Tema): Promise<PreguntaBanco[]> {
  const items = await itemsDeTema(supabaseAdmin(), perfilId, tema, "examen", LOTE);
  return items.map((i) => ({ ...(i.contenido as unknown as PreguntaExamen), id: i.id }));
}

/**
 * Tarjetas de la fase 1: de la última sesión completada y unas pocas de otras
 * sesiones completadas. Vacío en la primera sesión. Las de otras sesiones nunca
 * generan: salen de lo que ya hay.
 */
export async function tarjetasDeRepaso(perfilId: string): Promise<TarjetaRepaso[]> {
  const sb = supabaseAdmin();
  const estudio = await sb
    .from("sesiones_estudio")
    .select("tema_id, completada_en")
    .eq("perfil_id", perfilId)
    .eq("completada", true)
    .not("tema_id", "is", null)
    .order("completada_en", { ascending: false })
    .limit(500);
  if (estudio.error) throw new Error(`sesiones_estudio: ${estudio.error.message}`);

  const temaIds = [...new Set(estudio.data.map((s) => s.tema_id!))];
  if (!temaIds.length) return [];
  const [anteriorId, ...restantes] = temaIds;
  // ponytail: unos pocos temas al azar en vez de todos, por el máximo de 1000 filas de PostgREST
  const otrosIds = elegirItems(restantes.map((id) => ({ id })), new Map(), TEMAS_OTRAS_SESIONES).map((t) => t.id);

  const temas = await sb.from("temas").select("id, titulo, bloque_id").in("id", [anteriorId, ...otrosIds]);
  if (temas.error) throw new Error(`temas: ${temas.error.message}`);
  const titulo = new Map(temas.data.map((t) => [t.id, t.titulo]));
  const fila = temas.data.find((t) => t.id === anteriorId);
  if (!fila) throw new Error(`Tema ${anteriorId} no encontrado`);
  const bloque = fila.bloque_id
    ? await sb.from("bloques").select("titulo").eq("id", fila.bloque_id).maybeSingle()
    : null;

  const anteriores = await itemsDeTema(
    sb,
    perfilId,
    { id: anteriorId, titulo: fila.titulo, bloque: bloque?.data?.titulo ?? fila.titulo },
    "repaso",
    TARJETAS_SESION_ANTERIOR
  );
  let otras: Item[] = [];
  if (otrosIds.length) {
    const candidatas = await cargarItems(sb, otrosIds, "repaso");
    const vistos = await cargarVistos(sb, perfilId, candidatas.map((i) => i.id));
    otras = elegirItems(candidatas, vistos, TARJETAS_OTRAS_SESIONES);
  }

  return [...anteriores, ...otras].map((i) => ({
    ...(i.contenido as unknown as Flashcard),
    id: i.id,
    tema: titulo.get(i.tema_id) ?? "",
  }));
}
