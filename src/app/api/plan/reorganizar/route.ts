import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { siguienteHueco } from "@/lib/plan/generador";
import { getPerfil } from "@/lib/perfil";
import { supabaseAdmin } from "@/lib/supabase/admin";

const bodySchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("perdida"), sesion_id: z.string().uuid() }),
  z.object({
    tipo: z.literal("resultado"),
    bloque_id: z.string().uuid(),
    tema_id: z.string().uuid().nullish(),
    pct: z.number().min(0).max(100),
  }),
  z.object({ tipo: z.literal("refuerzo"), bloque_id: z.string().uuid() }),
]);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });
  const perfil = await getPerfil(userId);
  if (!perfil) return NextResponse.json({ data: null, error: "Sin perfil" }, { status: 409 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: "Body inválido" }, { status: 400 });
  }
  const body = parsed.data;
  const sb = supabaseAdmin();

  const inscripcion = await sb
    .from("inscripciones")
    .select("id, config_plan")
    .eq("perfil_id", perfil.id)
    .eq("activa", true)
    .maybeSingle();
  if (!inscripcion.data) {
    return NextResponse.json({ data: null, error: "Sin plan activo" }, { status: 409 });
  }
  const inscripcionId = inscripcion.data.id;
  const diasSemana =
    (inscripcion.data.config_plan as { dias_semana?: number[] })?.dias_semana ?? [1, 3, 5];

  // fechas ya ocupadas por sesiones pendientes (para buscar hueco libre)
  const pendientes = await sb
    .from("sesiones_plan")
    .select("fecha_programada")
    .eq("inscripcion_id", inscripcionId)
    .eq("estado", "pendiente");
  const ocupadas = new Set((pendientes.data ?? []).map((s) => s.fecha_programada));

  if (body.tipo === "perdida") {
    const sesion = await sb
      .from("sesiones_plan")
      .select("*")
      .eq("id", body.sesion_id)
      .eq("inscripcion_id", inscripcionId)
      .maybeSingle();
    if (!sesion.data) {
      return NextResponse.json({ data: null, error: "Sesión no encontrada" }, { status: 404 });
    }

    await sb.from("sesiones_plan").update({ estado: "perdida" }).eq("id", sesion.data.id);

    const fecha = siguienteHueco(diasSemana, ocupadas);
    const nueva = await sb
      .from("sesiones_plan")
      .insert({
        inscripcion_id: inscripcionId,
        tema_id: sesion.data.tema_id,
        bloque_id: sesion.data.bloque_id,
        fecha_programada: fecha,
        tipo: sesion.data.tipo,
        es_recuperada: true,
        motivo_cambio: `Recupera la sesión perdida del ${sesion.data.fecha_programada}`,
      })
      .select("id, fecha_programada")
      .single();
    if (nueva.error) {
      return NextResponse.json({ data: null, error: nueva.error.message }, { status: 500 });
    }

    await sb.from("historial_plan").insert({
      inscripcion_id: inscripcionId,
      tipo: "recuperada",
      motivo: "Sesión marcada como perdida",
      detalle: `Reprogramada al ${fecha}`,
      sesion_origen: sesion.data.id,
      sesion_nueva: nueva.data.id,
    });

    return NextResponse.json({ data: { nueva_fecha: fecha }, error: null });
  }

  // 'resultado' (< umbral) y 'refuerzo' (manual desde el informe): misma inserción
  if (body.tipo === "resultado" && body.pct >= 65) {
    return NextResponse.json({ data: { refuerzo: false }, error: null });
  }

  const fecha = siguienteHueco(diasSemana, ocupadas);
  const refuerzo = await sb
    .from("sesiones_plan")
    .insert({
      inscripcion_id: inscripcionId,
      tema_id: body.tipo === "resultado" ? (body.tema_id ?? null) : null,
      bloque_id: body.bloque_id,
      fecha_programada: fecha,
      tipo: "repaso",
      es_refuerzo: true,
      motivo_cambio:
        body.tipo === "resultado"
          ? `Refuerzo automático: resultado ${body.pct}% (< 65%)`
          : "Refuerzo añadido desde el informe",
    })
    .select("id")
    .single();
  if (refuerzo.error) {
    return NextResponse.json({ data: null, error: refuerzo.error.message }, { status: 500 });
  }

  await sb.from("historial_plan").insert({
    inscripcion_id: inscripcionId,
    tipo: "refuerzo",
    motivo:
      body.tipo === "resultado"
        ? `Dominio bajo (${body.pct}%) en el simulacro`
        : "Refuerzo manual desde el informe",
    detalle: `Sesión de refuerzo programada el ${fecha}`,
    sesion_nueva: refuerzo.data.id,
  });

  return NextResponse.json({ data: { refuerzo: true, fecha }, error: null });
}
