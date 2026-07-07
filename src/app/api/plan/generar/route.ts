import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generarSesiones, type BloquePlan } from "@/lib/plan/generador";
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

  // temario ordenado
  const bloquesRes = await sb
    .from("bloques")
    .select("id, titulo, orden")
    .eq("curso_id", curso.data.id)
    .order("orden");
  const temasRes = await sb
    .from("temas")
    .select("id, titulo, orden, horas_estimadas, bloque_id")
    .order("orden");
  if (!bloquesRes.data?.length || !temasRes.data?.length) {
    return NextResponse.json(
      { data: null, error: "Temario vacío: ejecuta el seed del temario" },
      { status: 409 }
    );
  }
  const bloques: BloquePlan[] = bloquesRes.data.map((b) => ({
    id: b.id,
    titulo: b.titulo,
    temas: (temasRes.data ?? [])
      .filter((t) => t.bloque_id === b.id)
      .map((t) => ({ id: t.id, titulo: t.titulo, horas: Number(t.horas_estimadas) || 2 })),
  }));

  const sesiones = generarSesiones({
    bloques,
    config: { dias_semana, horas_sesion, intensidad },
    fechaInicio: new Date(),
  });

  // insert en lotes de 100
  for (let i = 0; i < sesiones.length; i += 100) {
    const lote = sesiones.slice(i, i + 100).map((s) => ({ ...s, inscripcion_id: inscripcionId! }));
    const ins = await sb.from("sesiones_plan").insert(lote);
    if (ins.error) {
      return NextResponse.json({ data: null, error: ins.error.message }, { status: 500 });
    }
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

  const fechaFin = sesiones[sesiones.length - 1]?.fecha_programada;
  const semanas = Math.ceil(
    (new Date(fechaFin).getTime() - Date.now()) / (7 * 24 * 3600 * 1000)
  );

  return NextResponse.json({
    data: {
      total_sesiones: sesiones.length,
      semanas,
      fecha_inicio: sesiones[0]?.fecha_programada,
      fecha_fin: fechaFin,
      cabe_antes_del_examen: fechaFin <= fecha_examen,
      aviso: avisoMigracion,
    },
    error: null,
  });
}
