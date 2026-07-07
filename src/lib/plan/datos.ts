import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { InscripcionRow, SesionPlanRow } from "@/types/database";

export interface SesionConTema extends SesionPlanRow {
  tema_titulo: string | null;
  bloque_titulo: string | null;
}

/**
 * Inscripción activa + sesiones del plan con títulos resueltos.
 * Server-only; cache() deduplica dentro del mismo render.
 */
export const getPlanUsuario = cache(
  async (
    perfilId: string
  ): Promise<{ inscripcion: InscripcionRow | null; sesiones: SesionConTema[] }> => {
    const sb = supabaseAdmin();
    const inscripcion = await sb
      .from("inscripciones")
      .select("*")
      .eq("perfil_id", perfilId)
      .eq("activa", true)
      .maybeSingle();
    if (!inscripcion.data) return { inscripcion: null, sesiones: [] };

    const [sesiones, temas, bloques] = await Promise.all([
      sb
        .from("sesiones_plan")
        .select("*")
        .eq("inscripcion_id", inscripcion.data.id)
        .order("fecha_programada")
        .order("orden"),
      sb.from("temas").select("id, titulo"),
      sb.from("bloques").select("id, titulo"),
    ]);

    const temaTitulo = new Map((temas.data ?? []).map((t) => [t.id, t.titulo]));
    const bloqueTitulo = new Map((bloques.data ?? []).map((b) => [b.id, b.titulo]));

    return {
      inscripcion: inscripcion.data,
      sesiones: (sesiones.data ?? []).map((s) => ({
        ...s,
        tema_titulo: s.tema_id ? (temaTitulo.get(s.tema_id) ?? null) : null,
        bloque_titulo: s.bloque_id ? (bloqueTitulo.get(s.bloque_id) ?? null) : null,
      })),
    };
  }
);
