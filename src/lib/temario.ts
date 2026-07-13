import { supabaseAdmin } from "@/lib/supabase/admin";

export interface PuntoArbol {
  id: string;
  titulo: string;
  orden: number;
  keywords: string[];
  dominio: number;
  completado: boolean;
}
export interface SubtemaArbol {
  id: string;
  titulo: string;
  orden: number;
  puntos: PuntoArbol[];
}
export interface TemaArbol {
  id: string;
  numero: number | null;
  titulo: string;
  parte: string | null;
  capitulo_kanski: string | null;
  progreso_dominio: number;
  completado: boolean;
  subtemas: SubtemaArbol[];
}
export interface BloqueArbol {
  id: string;
  titulo: string;
  temas: TemaArbol[];
}
export interface TemarioArbol {
  bloques: BloqueArbol[];
  total_puntos: number;
  puntos_completados: number;
  disponible: boolean; // false si el temario aún no está seedeado
}

const DOMINIO_COMPLETADO = 75;

/**
 * Árbol completo del temario (bloque → tema → subtema → punto) con el dominio
 * del usuario por punto. Server-only. Devuelve disponible=false si faltan las
 * tablas (migración 0005) o el seed del temario oficial.
 */
export async function getTemarioArbol(perfilId: string | null): Promise<TemarioArbol> {
  const sb = supabaseAdmin();
  const vacio: TemarioArbol = { bloques: [], total_puntos: 0, puntos_completados: 0, disponible: false };

  const cursoRes = await sb.from("cursos").select("id").eq("slug", "oir-sas-2026").maybeSingle();
  if (!cursoRes.data) return vacio;

  let bloques, temas, subtemas, puntos;
  try {
    [bloques, temas, subtemas, puntos] = await Promise.all([
      sb.from("bloques").select("id, titulo, orden").eq("curso_id", cursoRes.data.id).order("orden"),
      sb.from("temas").select("id, bloque_id, titulo, numero_boja, parte, capitulo_kanski, orden").order("orden"),
      sb.from("subtemas").select("id, tema_id, titulo, orden").order("orden"),
      sb.from("puntos").select("id, subtema_id, titulo, orden, keywords").order("orden"),
    ]);
  } catch {
    return vacio;
  }
  if (bloques.error || temas.error || subtemas.error || puntos.error) return vacio;
  if (!puntos.data?.length) return vacio;

  // dominio del usuario por punto
  const dominioPorPunto = new Map<string, number>();
  if (perfilId) {
    const prog = await sb.from("progreso_puntos").select("punto_id, dominio").eq("perfil_id", perfilId);
    for (const p of prog.data ?? []) dominioPorPunto.set(p.punto_id, p.dominio);
  }

  const puntosPorSubtema = new Map<string, PuntoArbol[]>();
  let totalPuntos = 0;
  let completados = 0;
  for (const p of puntos.data) {
    if (!p.subtema_id) continue;
    const dominio = dominioPorPunto.get(p.id) ?? 0;
    const completado = dominio >= DOMINIO_COMPLETADO;
    totalPuntos++;
    if (completado) completados++;
    const arr = puntosPorSubtema.get(p.subtema_id) ?? [];
    arr.push({ id: p.id, titulo: p.titulo, orden: p.orden, keywords: p.keywords ?? [], dominio, completado });
    puntosPorSubtema.set(p.subtema_id, arr);
  }

  const subtemasPorTema = new Map<string, SubtemaArbol[]>();
  for (const s of subtemas.data ?? []) {
    if (!s.tema_id) continue;
    const arr = subtemasPorTema.get(s.tema_id) ?? [];
    arr.push({ id: s.id, titulo: s.titulo, orden: s.orden, puntos: puntosPorSubtema.get(s.id) ?? [] });
    subtemasPorTema.set(s.tema_id, arr);
  }

  const temasPorBloque = new Map<string, TemaArbol[]>();
  for (const t of temas.data ?? []) {
    if (!t.bloque_id) continue;
    const subs = subtemasPorTema.get(t.id) ?? [];
    const puntosTema = subs.flatMap((s) => s.puntos);
    const dominio = puntosTema.length
      ? Math.round(puntosTema.reduce((a, p) => a + p.dominio, 0) / puntosTema.length)
      : 0;
    const arr = temasPorBloque.get(t.bloque_id) ?? [];
    arr.push({
      id: t.id,
      numero: t.numero_boja ?? null,
      titulo: t.titulo,
      parte: t.parte ?? null,
      capitulo_kanski: t.capitulo_kanski ?? null,
      progreso_dominio: dominio,
      completado: dominio >= DOMINIO_COMPLETADO,
      subtemas: subs,
    });
    temasPorBloque.set(t.bloque_id, arr);
  }

  return {
    bloques: (bloques.data ?? []).map((b) => ({
      id: b.id,
      titulo: b.titulo,
      temas: temasPorBloque.get(b.id) ?? [],
    })),
    total_puntos: totalPuntos,
    puntos_completados: completados,
    disponible: true,
  };
}
