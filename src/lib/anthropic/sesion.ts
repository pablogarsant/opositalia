import { anthropic, MODEL } from "./client";
import type { TipoSesion } from "@/lib/plan/types";

export interface TextoLectura {
  titulo: string;
  cuerpo: string;
  idea_clave: string;
  mnemotecnia: string;
}

export interface Flashcard {
  pregunta: string;
  respuesta: string;
  dificultad: 1 | 2 | 3;
}

export interface PreguntaExamen {
  enunciado: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
}

export interface MapaMental {
  central: string;
  ramas: { titulo: string; hijos: string[] }[];
}

export interface ContenidoLectura {
  textos: TextoLectura[];
  conceptos_clave: string[];
  mapa_mental: MapaMental;
}

export interface ContenidoRepaso {
  flashcards: Flashcard[];
}

export interface ContenidoExamen {
  preguntas: PreguntaExamen[];
}

const BASE = `Eres experto en didáctica médica preparando material OIR de Oftalmología (SAS Andalucía) en español de España. Genera contenido riguroso BASADO EN EL CONTEXTO proporcionado (fragmentos del Kanski). No inventes datos que el contexto no respalde. Responde SOLO con JSON válido, sin markdown ni comentarios.`;

const PROMPTS: Record<TipoSesion, string> = {
  lectura: `Genera el material de estudio del tema con este JSON exacto:
{"textos":[{"titulo":"...","cuerpo":"400-600 caracteres de texto didáctico","idea_clave":"la idea que hay que retener","mnemotecnia":"regla mnemotécnica original en español"}],"conceptos_clave":["5 conceptos esenciales del tema"],"mapa_mental":{"central":"tema","ramas":[{"titulo":"rama","hijos":["subconcepto","subconcepto"]}]}}
Entre 4 y 6 textos, 5 conceptos_clave, 4-6 ramas con 2-4 hijos.`,
  repaso: `Genera flashcards de repaso espaciado con este JSON exacto:
{"flashcards":[{"pregunta":"...","respuesta":"breve y precisa","dificultad":1}]}
10 flashcards; dificultad 1 (básica), 2 (media) o 3 (avanzada), mezcladas.`,
  examen: `Genera un simulacro tipo OIR con este JSON exacto:
{"preguntas":[{"enunciado":"caso o pregunta estilo examen OIR","opciones":["A","B","C","D"],"correcta":0,"explicacion":"por qué es correcta y por qué fallan las demás"}]}
10 preguntas, exactamente 4 opciones cada una, "correcta" es el índice 0-3. Dificultad de examen real: distractores plausibles.`,
};

/** Genera el contenido de una sesión con Claude + contexto RAG. */
export async function generarContenidoSesion(
  tipo: TipoSesion,
  tema: string,
  bloque: string,
  contextoRag: string
): Promise<ContenidoLectura | ContenidoRepaso | ContenidoExamen> {
  const user = [
    `TEMA: ${tema}`,
    `BLOQUE: ${bloque}`,
    contextoRag ? `\n== CONTEXTO ==\n${contextoRag}` : "\n(sin contexto RAG: usa conocimiento estándar y márcalo prudente)",
    `\n${PROMPTS[tipo]}`,
  ].join("\n");

  // streaming: las generaciones largas (examen/lectura) superan el timeout no-stream
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 8000,
    system: BASE,
    messages: [{ role: "user", content: user }],
  });
  const respuesta = await stream.finalMessage();
  const texto = respuesta.content[0].type === "text" ? respuesta.content[0].text : "";
  return parseJson(texto);
}

function parseJson<T>(texto: string): T {
  // tolera fences ```json que el modelo a veces añade pese a la instrucción
  const limpio = texto.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try {
    return JSON.parse(limpio) as T;
  } catch {
    const inicio = limpio.indexOf("{");
    const fin = limpio.lastIndexOf("}");
    if (inicio >= 0 && fin > inicio) {
      return JSON.parse(limpio.slice(inicio, fin + 1)) as T;
    }
    throw new Error("La respuesta del modelo no es JSON válido");
  }
}
