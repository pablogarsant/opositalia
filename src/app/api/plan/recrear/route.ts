import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { replanificar } from "@/lib/plan/generador";
import { cargarBloquesPlan, insertarSesiones, resumenPlan } from "@/lib/plan/motor";
import { getPerfil } from "@/lib/perfil";
import { supabaseAdmin } from "@/lib/supabase/admin";

const bodySchema = z.object({
  // "empezar de cero" pendiente de decidir qué borra (favoritos y notas)
  modo: z.literal("conservar"),
  fecha_examen: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dias_semana: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  horas_sesion: z.number().min(0.5).max(6),
  intensidad: z.enum(["ligera", "media", "intensa"]),
});

const error = (msg: string, status: number) => NextResponse.json({ data: null, error: msg }, { status });

/** Lotes para filtros .in(): cientos de uuids no caben en una URL de PostgREST. */
function enLotes<T>(arr: T[], n = 100): T[][] {
  return Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, (i + 1) * n));
}

/**
 * Recrea el plan con una configuración nueva conservando el progreso:
 * las sesiones completadas y el resto del historial se quedan; las pendientes
 * se sustituyen por un plan nuevo desde hoy sin repetir lo ya completado.
 * /api/plan/generar no sirve: devuelve 409 si ya hay plan.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return error("No autenticado", 401);
  const perfil = await getPerfil(userId);
  if (!perfil) return error("Perfil no encontrado", 409);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error(`Configuración inválida: ${parsed.error.issues[0]?.message}`, 400);
  const { fecha_examen, dias_semana, horas_sesion, intensidad } = parsed.data;
  const config = { dias_semana, horas_sesion, intensidad };
  const sb = supabaseAdmin();

  const inscripcion = await sb
    .from("inscripciones")
    .select("id, curso_id")
    .eq("perfil_id", perfil.id)
    .eq("activa", true)
    .maybeSingle();
  if (inscripcion.error) return error(`inscripciones: ${inscripcion.error.message}`, 500);
  if (!inscripcion.data?.curso_id) return error("No tienes un plan activo que recrear", 409);
  const inscripcionId = inscripcion.data.id;

  const actuales = await sb
    .from("sesiones_plan")
    .select("id, tema_id, bloque_id, tipo, estado, es_refuerzo")
    .eq("inscripcion_id", inscripcionId);
  if (actuales.error) return error(`sesiones_plan: ${actuales.error.message}`, 500);

  // los refuerzos completados son extra: no descuentan sesiones del plan base
  const hechas = actuales.data
    .filter((s) => s.estado === "completada" && !s.es_refuerzo && s.bloque_id)
    .map((s) => ({ tema_id: s.tema_id, bloque_id: s.bloque_id!, tipo: s.tipo }));
  const pendientes = actuales.data.filter((s) => s.estado === "pendiente").map((s) => s.id);

  let nuevas;
  try {
    const bloques = await cargarBloquesPlan(sb, inscripcion.data.curso_id);
    nuevas = replanificar({ bloques, config, fechaInicio: new Date(), hechas });
    // ponytail: sin transacción (PostgREST). Se inserta antes de borrar: si algo
    // falla a medias, sobran sesiones en vez de faltar. Atómico = una RPC en SQL.
    await insertarSesiones(sb, inscripcionId, nuevas);
  } catch (e) {
    return error(`No se pudo generar el plan nuevo: ${e instanceof Error ? e.message : e}`, 500);
  }

  // FK sin cascade hacia sesiones_plan: se sueltan las referencias antes de borrar
  for (const lote of enLotes(pendientes)) {
    const pasos = [
      () => sb.from("historial_plan").update({ sesion_origen: null }).in("sesion_origen", lote),
      () => sb.from("historial_plan").update({ sesion_nueva: null }).in("sesion_nueva", lote),
      () => sb.from("sesiones_estudio").update({ sesion_plan_id: null }).in("sesion_plan_id", lote),
      () => sb.from("sesiones_plan").delete().in("id", lote),
    ];
    for (const paso of pasos) {
      const r = await paso();
      if (r.error) {
        return error(
          `Plan nuevo creado pero quedan sesiones antiguas pendientes duplicadas: ${r.error.message}`,
          500
        );
      }
    }
  }

  const upd = await sb
    .from("inscripciones")
    .update({ fecha_examen, config_plan: config })
    .eq("id", inscripcionId);
  if (upd.error) console.error(`inscripcion ${inscripcionId} config:`, upd.error.message);

  const hist = await sb.from("historial_plan").insert({
    inscripcion_id: inscripcionId,
    tipo: "recreado",
    motivo: "Plan recreado conservando el progreso",
    detalle: `${pendientes.length} pendientes sustituidas por ${nuevas.length}; ${hechas.length} completadas conservadas. Días ${dias_semana.join(",")}, ${horas_sesion} h, profundidad ${intensidad}, examen ${fecha_examen}.`,
  });
  if (hist.error) console.error("historial_plan recreado (¿falta la migración 0009?):", hist.error.message);

  return NextResponse.json({
    data: {
      ...resumenPlan(nuevas, fecha_examen),
      conservadas: hechas.length,
      aviso: hist.error ? "Plan recreado, pero falta la migración 0009 para anotarlo en el historial" : null,
    },
    error: null,
  });
}
