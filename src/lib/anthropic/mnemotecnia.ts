import { anthropic, MODEL } from "./client";

export async function generarMnemotecnia(concepto: string, contexto?: string) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: "Eres un experto en mnemotecnia médica. Crea reglas mnemotécnicas originales, memorables y precisas.",
    messages: [
      {
        role: "user",
        content: `Crea una mnemotecnia para recordar: "${concepto}"${contexto ? `. Contexto: ${contexto}` : ""}.`,
      },
    ],
  });
  return response.content[0].type === "text" ? response.content[0].text : "";
}
