import { anthropic, MODEL } from "./client";

export async function consultarChatbot(messages: { role: "user" | "assistant"; content: string }[]) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: "Eres un tutor médico experto en oposiciones. Responde de forma clara, precisa y pedagógica. No inventes información clínica.",
    messages,
  });
  return response.content[0].type === "text" ? response.content[0].text : "";
}
