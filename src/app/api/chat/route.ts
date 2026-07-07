import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { streamChatConRag } from "@/lib/anthropic/chat";

const bodySchema = z.object({
  mensaje: z.string().min(1).max(2000),
  tema_actual: z.string().max(200).nullish(),
  bloque: z.string().max(100).nullish(),
  fase: z.number().int().min(1).max(5).nullish(),
  historial: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(20)
    .default([]),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: "Body inválido" }, { status: 400 });
  }
  const { mensaje, tema_actual, bloque, fase, historial } = parsed.data;

  // el simulacro se hace sin ayuda: chatbot bloqueado en fase 5
  if (fase === 5) {
    return NextResponse.json(
      { data: null, error: "El consultor no está disponible durante el simulacro" },
      { status: 403 }
    );
  }

  const stream = await streamChatConRag({
    mensaje,
    temaActual: tema_actual,
    bloque,
    historial,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ token: event.delta.text })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "error de streaming";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
