import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { lecturaValida, streamLecturaPunto, type ParteTemario } from "@/lib/anthropic/sesion";
import { fuentesDeChunks } from "@/lib/contenido/formatear";
import { buscarParaLectura, formatearContexto } from "@/lib/rag";
import { supabaseAdmin } from "@/lib/supabase/admin";

// ~1.800 palabras en streaming: el texto llega poco a poco, pero la función vive hasta el final
export const maxDuration = 120;

const bodySchema = z.object({ punto_id: z.string().uuid() });

/** Fuente de la lectura: chunk literal (Fase 6 lo abre por chunk_id) + documento y páginas. */
export interface FuenteLectura {
  chunk_id: string;
  documento: string;
  pagina?: string;
}

interface CacheLectura {
  markdown: string;
  fuentes: FuenteLectura[];
}

const errorJson = (error: string, status: number) => NextResponse.json({ data: null, error }, { status });

/**
 * Lectura extensa de un punto del temario, generada bajo demanda.
 * Respuesta: text/markdown en streaming; las fuentes van en la cabecera X-Fuentes
 * (JSON urlencoded) porque se conocen antes de generar.
 */
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return errorJson("Body inválido: falta punto_id (uuid)", 400);
  const puntoId = parsed.data.punto_id;
  const sb = supabaseAdmin();
  const cacheKey = `v2:punto:${puntoId}:lectura`;

  const punto = await sb.from("puntos").select("titulo, keywords, subtema_id").eq("id", puntoId).maybeSingle();
  if (punto.error || !punto.data?.subtema_id) {
    return errorJson(`Punto ${puntoId} no encontrado${punto.error ? `: ${punto.error.message}` : ""}`, 404);
  }
  const subtema = await sb.from("subtemas").select("titulo, tema_id").eq("id", punto.data.subtema_id).single();
  if (subtema.error || !subtema.data.tema_id) {
    return errorJson(`Subtema del punto ${puntoId} sin tema: ${subtema.error?.message ?? "tema_id nulo"}`, 500);
  }
  const tema = await sb.from("temas").select("id, titulo, parte").eq("id", subtema.data.tema_id).single();
  if (tema.error) return errorJson(`Tema del punto ${puntoId}: ${tema.error.message}`, 500);
  const parte: ParteTemario = tema.data.parte === "comun" ? "comun" : "especifica";

  const cabeceras = (fuentes: FuenteLectura[]) => ({
    "Content-Type": "text/markdown; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Fuentes": encodeURIComponent(JSON.stringify(fuentes)),
  });

  const cache = await sb.from("sesion_cache").select("contenido").eq("cache_key", cacheKey).maybeSingle();
  if (cache.error) console.error(`sesion_cache ${cacheKey}:`, cache.error.message);
  if (cache.data) {
    const c = cache.data.contenido as unknown as CacheLectura;
    return new Response(c.markdown, { headers: cabeceras(c.fuentes) });
  }

  let chunks;
  try {
    const consulta = [tema.data.titulo, subtema.data.titulo, punto.data.titulo, ...(punto.data.keywords ?? [])].join(" — ");
    chunks = await buscarParaLectura(consulta);
  } catch (e) {
    return errorJson(`RAG del punto ${puntoId}: ${e instanceof Error ? e.message : e}`, 502);
  }
  const fuentes: FuenteLectura[] = chunks.map((c) => ({ chunk_id: c.id!, ...fuentesDeChunks([c])[0] }));

  const stream = streamLecturaPunto({
    tema: tema.data.titulo,
    subtema: subtema.data.titulo,
    punto: punto.data.titulo,
    parte,
    contexto: formatearContexto(chunks),
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      let markdown = "";
      try {
        for await (const ev of stream) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            markdown += ev.delta.text;
            controller.enqueue(encoder.encode(ev.delta.text));
          }
        }
        const final = await stream.finalMessage();
        // coste y corte por punto: base de la medición antes/después de la Fase 8
        console.info(
          `lectura ${puntoId}: chunks=${chunks.length} in=${final.usage.input_tokens} out=${final.usage.output_tokens} stop=${final.stop_reason}`
        );
        const valida = lecturaValida(parte).safeParse({ stop_reason: final.stop_reason, markdown });
        if (!valida.success) {
          // se muestra lo generado, pero no se guarda: la próxima apertura regenera
          console.error(`lectura ${puntoId} no cacheada:`, valida.error.issues.map((i) => i.message).join("; "));
        } else {
          const ins = await sb.from("sesion_cache").insert({
            cache_key: cacheKey,
            tema_id: tema.data.id,
            bloque: parte,
            tipo: "lectura",
            contenido: { markdown, fuentes } as unknown as Record<string, unknown>,
          });
          if (ins.error) console.error(`sesion_cache insert ${cacheKey}:`, ins.error.message);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`lectura ${puntoId} cortada:`, msg);
        controller.enqueue(encoder.encode(`\n\n> No se pudo terminar la lectura (${msg}). Vuelve a abrir el punto.`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, { headers: cabeceras(fuentes) });
}
