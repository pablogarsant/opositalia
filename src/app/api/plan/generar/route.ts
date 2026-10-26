import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generarSesiones, type BloquePlan } from "@/lib/plan/generador";
import { cargarBloquesPlan, insertarSesiones, resumenPlan } from "@/lib/plan/motor";
import { getPerfil } from "@/lib/perfil";
import { supabaseAdmin } from "@/lib/supabase/admin";

const bodySchema = z.object({
  curso_slug: z.string().default("oir-sas-2026"),
  fecha_examen: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dias_semana: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  horas_sesion: z.number().min(0.5).max(6),
  intensidad: z.enum(["ligera", "media", "intensa"]),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: "Configuración inválida" }, { status: 400 });
  }
  const { curso_slug, fecha_examen, dias_semana, horas_sesion, intensidad } = parsed.data;
  const sb = supabaseAdmin();

  // perfil (self-healing: si el webhook no llegó a crearlo, se crea aquí)
  let perfil = await getPerfil(userId);
  if (!perfil) {
    const creado = await sb
      .from("perfiles")
      .upsert({ clerk_id: userId }, { onConflict: "clerk_id" })
      .select("*")
      .single();
    if (creado.error) {
      return NextResponse.json({ data: null, error: creado.error.message }, { status: 500 });
    }
    perfil = creado.data;
  }

  const curso = await sb.from("cursos").select("id").eq("slug", curso_slug).maybeSingle();
  if (!curso.data) {
    return NextResponse.json({ data: null, error: "Curso no encontrado" }, { status: 404 });
  }

  // un plan activo por curso: si ya existe con sesiones, no se duplica
  const inscripcionPrevia = await sb
    .from("inscripciones")
    .select("id")
    .eq("perfil_id", perfil.id)
    .eq("curso_id", curso.data.id)
    .maybeSingle();

  let inscripcionId = inscripcionPrevia.data?.id;
  if (inscripcionId) {
    const sesionesPrevias = await sb
      .from("sesiones_plan")
      .select("id", { count: "exact" })
      .eq("inscripcion_id", inscripcionId)
      .limit(1);
    if ((sesionesPrevias.count ?? 0) > 0) {
      // ya estaba onboarded aunque el flag no lo dijera (p.ej. migración tardía)
      await sb
        .from("perfiles")
        .update({ onboarding_completado: true, curso_id: curso.data.id })
        .eq("id", perfil.id);
      return NextResponse.json(
        { data: null, error: "Ya tienes un plan generado para este curso" },
        { status: 409 }
      );
    }
    await sb
      .from("inscripciones")
      .update({ fecha_examen, config_plan: { dias_semana, horas_sesion, intensidad } })
      .eq("id", inscripcionId);
  } else {
    const ins = await sb
      .from("inscripciones")
      .insert({
        perfil_id: perfil.id,
        curso_id: curso.data.id,
        fecha_inicio: new Date().toISOString().slice(0, 10),
        fecha_examen,
        config_plan: { dias_semana, horas_sesion, intensidad },
      })
      .select("id")
      .single();
    if (ins.error) {
      return NextResponse.json({ data: null, error: ins.error.message }, { status: 500 });
    }
    inscripcionId = ins.data.id;
  }

  let bloques: BloquePlan[];
  try {
    bloques = await cargarBloquesPlan(sb, curso.data.id);
  } catch (e) {
    return NextResponse.json({ data: null, error: e instanceof Error ? e.message : String(e) }, { status: 409 });
  }

  const sesiones = generarSesiones({
    bloques,
    config: { dias_semana, horas_sesion, intensidad },
    fechaInicio: new Date(),
  });

  try {
    await insertarSesiones(sb, inscripcionId!, sesiones);
  } catch (e) {
    return NextResponse.json({ data: null, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }

  // progreso inicial de cada tema (idempotente vía ignoreDuplicates)
  const progresoInicial = bloques.flatMap((b) =>
    b.temas.map((t) => ({ perfil_id: perfil.id, tema_id: t.id, bloque_id: b.id, dominio: 0 }))
  );
  await sb.from("progreso_temas").upsert(progresoInicial, {
    onConflict: "perfil_id,tema_id",
    ignoreDuplicates: true,
  });

  // marca onboarding completado (si la migración 0004 no está, no rompe el plan)
  const updPerfil = await sb
    .from("perfiles")
    .update({ onboarding_completado: true, curso_id: curso.data.id })
    .eq("id", perfil.id);
  const avisoMigracion = updPerfil.error
    ? "Plan creado, pero falta la migración 0004 (onboarding_completado)"
    : null;

  return NextResponse.json({
    data: { ...resumenPlan(sesiones, fecha_examen), aviso: avisoMigracion },
    error: null,
  });
}
