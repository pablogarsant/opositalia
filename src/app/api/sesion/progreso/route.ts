import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { UMBRAL_REFUERZO } from "@/lib/plan/types";
import { getPerfil } from "@/lib/perfil";
import { supabaseAdmin } from "@/lib/supabase/admin";

const bodySchema = z.object({
  tema_id: z.string().uuid().nullish(),
  bloque_id: z.string().uuid().nullish(),
  bloque: z.string().max(100).nullish(),
  correctas: z.number().int().min(0),
  total: z.number().int().min(1),
  duracion_seg: z.number().int().min(0).default(0),
  respuestas: z
    .array(
      z.object({
        pregunta: z.string().max(2000),
        elegida: z.number().int().min(0).max(3).nullable(),
        correcta: z.number().int().min(0).max(3),
      })
    )
    .max(50)
    .default([]),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });
  }
  const perfil = await getPerfil(userId);
  if (!perfil) {
    return NextResponse.json(
      { data: null, error: "Perfil no encontrado (¿webhook de Clerk configurado?)" },
      { status: 409 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: "Body inválido" }, { status: 400 });
  }
  const { tema_id, bloque_id, bloque, correctas, total, duracion_seg, respuestas } = parsed.data;
  const dominio = Math.round((correctas / total) * 100);
  const sb = supabaseAdmin();

  const sesion = await sb
    .from("sesiones_estudio")
    .insert({
      perfil_id: perfil.id,
      tema_id: tema_id ?? null,
      fase_actual: 5,
      completada: true,
      duracion_seg,
      completada_en: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (sesion.error) {
    return NextResponse.json({ data: null, error: sesion.error.message }, { status: 500 });
  }

  if (respuestas.length) {
    await sb.from("respuestas_examen").insert(
      respuestas.map((r) => ({
        sesion_id: sesion.data.id,
        pregunta_texto: r.pregunta,
        opcion_elegida: r.elegida,
        opcion_correcta: r.correcta,
        es_correcta: r.elegida === r.correcta,
        bloque: bloque ?? null,
      }))
    );
  }

  // dominio del tema (solo si el temario está seedeado y llegó tema_id)
  if (tema_id) {
    const previo = await sb
      .from("progreso_temas")
      .select("id, sesiones_hechas")
      .eq("perfil_id", perfil.id)
      .eq("tema_id", tema_id)
      .maybeSingle();
    if (previo.data) {
      await sb
        .from("progreso_temas")
        .update({
          dominio,
          sesiones_hechas: (previo.data.sesiones_hechas ?? 0) + 1,
          ultima_sesion: new Date().toISOString(),
        })
        .eq("id", previo.data.id);
    } else {
      await sb.from("progreso_temas").insert({
        perfil_id: perfil.id,
        tema_id,
        bloque_id: bloque_id ?? null,
        dominio,
        sesiones_hechas: 1,
        ultima_sesion: new Date().toISOString(),
      });
    }
  }

  // el motor de reorganización del plan llega con la fase de plan;
  // de momento el cliente recibe la señal de refuerzo (umbral 65%)
  return NextResponse.json({
    data: {
      dominio,
      refuerzo_recomendado: dominio < UMBRAL_REFUERZO,
      sesion_id: sesion.data.id,
    },
    error: null,
  });
}
