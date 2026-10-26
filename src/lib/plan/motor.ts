import type { TipoSesion } from "./types";
import { UMBRAL_REFUERZO } from "./types";
import type { BloquePlan, SesionGenerada } from "./generador";
import type { supabaseAdmin } from "@/lib/supabase/admin";

type Supabase = ReturnType<typeof supabaseAdmin>;

export function necesitaRefuerzo(dominio: number): boolean {
  return dominio < UMBRAL_REFUERZO;
}

export function calcularTipoSiguienteSesion(sesionesHechas: number): TipoSesion {
  // Ciclo por bloque: lectura → repaso → examen
  const ciclo: TipoSesion[] = ["lectura", "repaso", "examen"];
  return ciclo[sesionesHechas % 3];
}

// ── Persistencia del plan (compartida por /api/plan/generar y /api/plan/recrear) ──

/**
 * Temario del curso en el formato del generador, con el nº real de puntos por
 * tema (el mismo peso que usa el preview del onboarding).
 */
export async function cargarBloquesPlan(sb: Supabase, cursoId: string): Promise<BloquePlan[]> {
  const [bloquesRes, temasRes, subtemasRes, puntosRes] = await Promise.all([
    sb.from("bloques").select("id, titulo, orden").eq("curso_id", cursoId).order("orden"),
    sb.from("temas").select("id, titulo, orden, horas_estimadas, bloque_id, parte").order("orden"),
    sb.from("subtemas").select("id, tema_id"),
    // ponytail: 982 puntos, bajo el max-rows de 1000 de PostgREST; si el temario crece, contar en SQL
    sb.from("puntos").select("subtema_id"),
  ]);
  const fallo = bloquesRes.error ?? temasRes.error ?? subtemasRes.error ?? puntosRes.error;
  if (fallo) throw new Error(`Temario del plan: ${fallo.message}`);
  const [bloques, temas] = [bloquesRes.data ?? [], temasRes.data ?? []];
  if (!bloques.length || !temas.length) throw new Error("Temario vacío: ejecuta el seed del temario");

  const temaDeSubtema = new Map((subtemasRes.data ?? []).map((s) => [s.id, s.tema_id]));
  const puntosPorTema = new Map<string, number>();
  for (const p of puntosRes.data ?? []) {
    const tema = p.subtema_id ? temaDeSubtema.get(p.subtema_id) : null;
    if (tema) puntosPorTema.set(tema, (puntosPorTema.get(tema) ?? 0) + 1);
  }

  return bloques.map((b) => ({
    id: b.id,
    titulo: b.titulo,
    temas: temas
      .filter((t) => t.bloque_id === b.id)
      .map((t) => ({
        id: t.id,
        titulo: t.titulo,
        horas: Number(t.horas_estimadas) || 2,
        parte: (t as { parte?: "comun" | "especifica" }).parte,
        puntos: puntosPorTema.get(t.id),
      })),
  }));
}

/** Inserta las sesiones generadas en lotes de 100. Lanza con el lote que falló. */
export async function insertarSesiones(sb: Supabase, inscripcionId: string, sesiones: SesionGenerada[]) {
  for (let i = 0; i < sesiones.length; i += 100) {
    const lote = sesiones.slice(i, i + 100).map((s) => ({ ...s, inscripcion_id: inscripcionId }));
    const ins = await sb.from("sesiones_plan").insert(lote);
    if (ins.error) throw new Error(`sesiones_plan lote ${i / 100 + 1}: ${ins.error.message}`);
  }
}

/** Semanas hasta la última sesión, para el resumen que ve la usuaria. */
export function resumenPlan(sesiones: SesionGenerada[], fechaExamen: string) {
  const fechaFin = sesiones[sesiones.length - 1]?.fecha_programada;
  return {
    total_sesiones: sesiones.length,
    semanas: fechaFin ? Math.ceil((new Date(fechaFin).getTime() - Date.now()) / (7 * 24 * 3600 * 1000)) : 0,
    fecha_inicio: sesiones[0]?.fecha_programada,
    fecha_fin: fechaFin,
    cabe_antes_del_examen: !fechaFin || fechaFin <= fechaExamen,
  };
}
