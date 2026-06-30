import { anthropic, MODEL } from "./client";

export async function generarContenidoSesion(tema: string, bloque: string, tipo: "lectura" | "repaso" | "examen") {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: "Eres un experto en didáctica médica. Genera contenido de estudio estructurado para oposiciones.",
    messages: [
      {
        role: "user",
        content: `Genera contenido de tipo "${tipo}" para el tema: "${tema}" (bloque: ${bloque}). Incluye flashcards, conceptos clave y preguntas tipo examen MIR según el tipo solicitado.`,
      },
    ],
  });
  return response.content[0].type === "text" ? response.content[0].text : "";
}
