import { anthropic, MODEL } from "./client";
import { formatearContexto, searchRag } from "@/lib/rag";

export interface MensajeChat {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_CONSULTOR = `Eres el consultor médico de Opositalia, una plataforma de preparación del examen OIR (Oftalmología, SAS Andalucía). Tu alumna está estudiando y te consulta dudas.

Reglas:
- Responde SIEMPRE en español de España, con terminología médica estándar.
- Sé preciso y pedagógico: explica el porqué, no solo el qué.
- Básate prioritariamente en el CONTEXTO DEL TEMARIO que se te proporciona (fragmentos del Kanski y bibliografía). Si el contexto no cubre la pregunta, dilo explícitamente y responde con tu conocimiento general marcándolo como tal.
- No inventes datos clínicos, dosis ni clasificaciones.
- Respuestas concisas: 2-6 frases salvo que pidan desarrollo.`;

/**
 * Chatbot consultor con contexto RAG. Devuelve el stream del SDK de Anthropic;
 * la route lo convierte en SSE.
 */
export async function streamChatConRag(params: {
  mensaje: string;
  temaActual?: string | null;
  bloque?: string | null;
  historial?: MensajeChat[];
}) {
  const { mensaje, temaActual, bloque, historial = [] } = params;

  // si el RAG falla, el chat degrada a conocimiento general (no rompe)
  const chunks = await searchRag(mensaje, bloque, 6).catch(() => []);
  const contexto = formatearContexto(chunks);

  const system = [
    SYSTEM_CONSULTOR,
    temaActual ? `\nTema que está estudiando ahora: ${temaActual}.` : "",
    contexto
      ? `\n== CONTEXTO DEL TEMARIO ==\n${contexto}`
      : "\n(No se encontró contexto en el temario para esta consulta.)",
  ].join("\n");

  return anthropic.messages.stream({
    model: MODEL,
    max_tokens: 1500,
    system,
    messages: [...historial.slice(-10), { role: "user", content: mensaje }],
  });
}
