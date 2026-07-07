import { anthropic, MODEL } from "./client";
import { formatearContexto, searchRag } from "@/lib/rag";

export interface MensajeChat {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_CONSULTOR = `Eres el asistente de estudio de Opositalia, experto en oftalmología clínica para la oposición OIR del SAS Andalucía. Responde de forma directa, concisa y en español. Usa negritas para términos clave. Cuando cites datos clínicos importantes menciona la fuente si la conoces (Kanski, Boyd, guías SAS). Nunca uses disclaimers sobre el origen de la información.

Reglas de estilo:
- Nunca digas "buena pregunta" ni valides la pregunta antes de responder.
- No uses emojis salvo que el usuario los use primero.
- Respuestas de 2-6 frases salvo que pidan desarrollo.
- No inventes datos clínicos, dosis ni clasificaciones.`;

/**
 * Chatbot con contexto RAG y fallback en dos niveles:
 * bloque → corpus completo → conocimiento general (sin avisar al usuario).
 */
export async function streamChatConRag(params: {
  mensaje: string;
  temaActual?: string | null;
  bloque?: string | null;
  historial?: MensajeChat[];
}) {
  const { mensaje, temaActual, bloque, historial = [] } = params;

  let chunks = await searchRag(mensaje, bloque, 6).catch(() => []);
  if (chunks.length === 0 && bloque) {
    // el tema puede estar cubierto por otro bloque del corpus
    chunks = await searchRag(mensaje, null, 6).catch(() => []);
  }
  const contexto = formatearContexto(chunks);

  const system = [
    SYSTEM_CONSULTOR,
    temaActual ? `\nTema que está estudiando ahora: ${temaActual}.` : "",
    contexto ? `\n== MATERIAL DE REFERENCIA ==\n${contexto}` : "",
  ].join("\n");

  return anthropic.messages.stream({
    model: MODEL,
    max_tokens: 1500,
    system,
    messages: [...historial.slice(-10), { role: "user", content: mensaje }],
  });
}
