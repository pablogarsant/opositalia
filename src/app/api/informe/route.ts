import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/anthropic/client";
import { getPerfil } from "@/lib/perfil";
import { getPlanUsuario } from "@/lib/plan/datos";
import { UMBRAL_REFUERZO } from "@/lib/plan/types";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface DominioBloque {
  bloque_id: string;
  bloque: string;
  dominio: number;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });
  const perfil = await getPerfil(userId);
  if (!perfil) return NextResponse.json({ data: null, error: "Sin perfil" }, { status: 409 });

  const sb = supabaseAdmin();
  const hace7 = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const hace7Fecha = hace7.slice(0, 10);
  const hoy = new Date().toISOString().slice(0, 10);

  const { sesiones } = await getPlanUsuario(perfil.id);
  const semanaPlan = sesiones.filter(
    (s) => s.fecha_programada >= hace7Fecha && s.fecha_programada <= hoy
  );
  const completadas = semanaPlan.filter((s) => s.estado === "completada").length;

  const [estudio, progreso, bloques] = await Promise.all([
    sb
      .from("sesiones_estudio")
      .select("id, duracion_seg")
      .eq("perfil_id", perfil.id)
      .gte("iniciada_en", hace7),
    sb.from("progreso_temas").select("tema_id, bloque_id, dominio").eq("perfil_id", perfil.id),
    sb.from("bloques").select("id, titulo"),
  ]);

  const horasSemana =
    (estudio.data ?? []).reduce((acc, s) => acc + (s.duracion_seg ?? 0), 0) / 3600;

  // precisión: respuestas de las sesiones de estudio de la semana
  const sesionIds = (estudio.data ?? []).map((s) => s.id);
  let precision: number | null = null;
  if (sesionIds.length) {
    const respuestas = await sb
      .from("respuestas_examen")
      .select("es_correcta")
      .in("sesion_id", sesionIds);
    const total = respuestas.data?.length ?? 0;
    if (total > 0) {
      precision = Math.round(
        ((respuestas.data ?? []).filter((r) => r.es_correcta).length / total) * 100
      );
    }
  }

  // dominio medio por bloque
  const bloqueTitulo = new Map((bloques.data ?? []).map((b) => [b.id, b.titulo]));
  const porBloque = new Map<string, number[]>();
  for (const p of progreso.data ?? []) {
    if (!p.bloque_id) continue;
    if (!porBloque.has(p.bloque_id)) porBloque.set(p.bloque_id, []);
    porBloque.get(p.bloque_id)!.push(p.dominio ?? 0);
  }
  const dominios: DominioBloque[] = [...porBloque.entries()]
    .map(([id, valores]) => ({
      bloque_id: id,
      bloque: bloqueTitulo.get(id) ?? "?",
      dominio: Math.round(valores.reduce((a, b) => a + b, 0) / valores.length),
    }))
    .sort((a, b) => a.dominio - b.dominio);

  const criticas = dominios.filter((d) => d.dominio < UMBRAL_REFUERZO);

  // análisis IA solo si hay áreas críticas con actividad real
  let analisis: string[] | null = null;
  if (criticas.length > 0 && (completadas > 0 || sesionIds.length > 0)) {
    try {
      const resp = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 600,
        system:
          "Eres tutor de oposiciones OIR de oftalmología. Responde SOLO un array JSON de exactamente 3 strings en español: recomendaciones concretas y accionables de estudio. Sin markdown.",
        messages: [
          {
            role: "user",
            content: `Semana: ${completadas}/${semanaPlan.length} sesiones completadas, ${horasSemana.toFixed(1)}h de estudio, precisión ${precision ?? "sin datos"}%. Bloques débiles: ${criticas.map((c) => `${c.bloque} (${c.dominio}%)`).join(", ")}.`,
          },
        ],
      });
      const texto = resp.content[0].type === "text" ? resp.content[0].text : "[]";
      const inicio = texto.indexOf("[");
      const fin = texto.lastIndexOf("]");
      analisis = JSON.parse(texto.slice(inicio, fin + 1)) as string[];
    } catch {
      analisis = null; // el informe funciona sin el análisis
    }
  }

  return NextResponse.json({
    data: {
      semana: { completadas, planificadas: semanaPlan.length, horas: Math.round(horasSemana * 10) / 10, precision },
      dominios,
      criticas,
      analisis,
    },
    error: null,
  });
}
