import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { streamChatConRag } from "@/lib/anthropic/chat";

const contextoSchema = z.object({
  pantalla: z.string().max(60).default("dashboard"),
  tema_id: z.string().max(60).nullish(),
  tema_titulo: z.string().max(300).nullish(),
  punto_id: z.string().max(60).nullish(),
  punto_titulo: z.string().max(300).nullish(),
  bloque: z.string().max(100).nullish(),
  fase_sesion: z.number().int().min(1).max(5).nullish(),
});

const bodySchema = z.object({
  mensaje: z.string().min(1).max(2000),
  contexto: contextoSchema.default({ pantalla: "dashboard" }),
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
  const { mensaje, contexto, historial } = parsed.data;

  // el simulacro se hace sin ayuda: chatbot bloqueado en fase 5.
  // ponytail: la fase la declara el cliente; una llamada directa sin fase_sesion
  // pasa. Aceptado (Fase 8): es práctica personal. Bloqueo real = guardar el
  // inicio del simulacro en servidor y consultarlo aquí.
  if (contexto.fase_sesion === 5) {
    return NextResponse.json(
      { data: null, error: "El asistente no está disponible durante el simulacro" },
      { status: 403 }
    );
  }

  const stream = await streamChatConRag({ mensaje, contexto, historial });

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
        console.error("chat: streaming cortado:", msg);
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
