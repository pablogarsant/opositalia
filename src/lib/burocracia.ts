import { createHash } from "node:crypto";
import { anthropic, MODEL } from "@/lib/anthropic/client";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface DatosBurocracia {
  convocatoria: string;
  especialidad: string;
  organismo: string;
  total_plazas: number;
  plazas_ope: number;
  plazas_discapacidad: number;
  fecha_examen: string;
  plazo_inscripcion_inicio: string;
  plazo_inscripcion_fin: string;
  enlace_boja: string;
  estructura_examen: {
    preguntas: number;
    preguntas_reserva: number;
    duracion_min: number;
    penalizacion: string;
    nota_minima: number;
  };
  timeline: { fecha: string; hito: string; descripcion: string; completado: boolean }[];
  requisitos: string[];
  ultima_actualizacion: string;
}

/** Datos reales de la convocatoria FEA OIR 2025 (SAS). Sirven de fallback y
 * coinciden con la migración 0006; la búsqueda web los actualiza si hay novedad. */
export const DATOS_FALLBACK: DatosBurocracia = {
  convocatoria: "FEA OIR 2025",
  especialidad: "FEA Oftalmología",
  organismo: "SAS — Servicio Andaluz de Salud",
  total_plazas: 30,
  plazas_ope: 29,
  plazas_discapacidad: 3,
  fecha_examen: "Pendiente de publicación (2026)",
  plazo_inscripcion_inicio: "2025-03-07",
  plazo_inscripcion_fin: "2025-04-28",
  enlace_boja:
    "https://www.sspa.juntadeandalucia.es/servicioandaluzdesalud/profesionales/ofertas-de-empleo/oferta-de-empleo-publico-puestos-base/convocatorias-oep-2025/cuadro-de-evolucion/fea-oftalmologia",
  estructura_examen: {
    preguntas: 150,
    preguntas_reserva: 3,
    duracion_min: 180,
    penalizacion: "Un error resta 1/4 de un acierto (-E/4)",
    nota_minima: 40,
  },
  timeline: [
    { fecha: "2025-01-27", hito: "Publicación bases generales", descripcion: "BOJA nº 17", completado: true },
    { fecha: "2025-03-07", hito: "Convocatoria específica FEA Oftalmología", descripcion: "BOJA nº 45", completado: true },
    { fecha: "2025-04-29", hito: "Plazo de autobaremo de méritos", descripcion: "15 días hábiles", completado: true },
    { fecha: "2025-12-31", hito: "Lista provisional de admitidos", descripcion: "Pendiente de publicación por el SAS", completado: false },
    { fecha: "2026-06-30", hito: "Fecha del examen", descripcion: "Pendiente de publicación", completado: false },
    { fecha: "2026-12-31", hito: "Resolución y adjudicación de plazas", descripcion: "Pendiente", completado: false },
  ],
  requisitos: [
    "Licenciado/Graduado en Medicina y Cirugía",
    "Título de Especialista en Oftalmología vía MIR",
    "Nacionalidad española o comunitaria (o asimilado por Tratados Internacionales)",
    "No haber sido separado por expediente disciplinario en los 6 años anteriores",
    "No estar inhabilitado para el ejercicio de funciones públicas",
    "No poseer plaza de personal estatutario fijo en la misma categoría en el SNS",
  ],
  ultima_actualizacion: "2025-07-12 — fuentes oficiales SAS/BOJA",
};

const DIAS_CACHE = 7;

function hashDatos(datos: unknown): string {
  return createHash("sha256").update(JSON.stringify(datos)).digest("hex").slice(0, 32);
}

/**
 * Busca la convocatoria en la web (tool web_search de Anthropic) y extrae
 * los datos estructurados. Devuelve null si no hay novedades utilizables.
 */
async function buscarConvocatoria(): Promise<DatosBurocracia | null> {
  const respuesta = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 3000,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
    system:
      "Eres un asistente que verifica convocatorias de oposiciones sanitarias en España. Busca información OFICIAL en el BOJA (juntadeandalucia.es/eboja.html) y en la web del SAS (sspa.juntadeandalucia.es, sección ofertas de empleo público). Responde SOLO con JSON válido, sin markdown.",
    messages: [
      {
        role: "user",
        content: `Busca la convocatoria más reciente de FEA Oftalmología del SAS Andalucía (BOJA 2025-2026): plazas, fecha de examen, plazo de inscripción, requisitos, estructura del examen y enlace al BOJA. Consulta el cuadro de evolución de la OEP del SAS para FEA Oftalmología.

Si encuentras datos oficiales, responde con este JSON exacto (fechas yyyy-mm-dd):
${JSON.stringify({ convocatoria: "", especialidad: "", organismo: "", total_plazas: 0, plazas_ope: 0, plazas_discapacidad: 0, fecha_examen: "", plazo_inscripcion_inicio: "", plazo_inscripcion_fin: "", enlace_boja: "", estructura_examen: { preguntas: 0, preguntas_reserva: 0, duracion_min: 0, penalizacion: "", nota_minima: 0 }, timeline: [{ fecha: "", hito: "", descripcion: "", completado: false }], requisitos: [""], ultima_actualizacion: "" })}

Si NO encuentras información oficial verificable, responde exactamente: null`,
      },
    ],
  });

  const texto = respuesta.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
  const limpio = texto.trim();
  if (!limpio || limpio === "null") return null;
  const inicio = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  if (inicio < 0 || fin <= inicio) return null;
  try {
    const datos = JSON.parse(limpio.slice(inicio, fin + 1)) as DatosBurocracia;
    if (!datos.fecha_examen || !datos.convocatoria) return null;
    datos.ultima_actualizacion = new Date().toISOString().slice(0, 10);
    return datos;
  } catch {
    return null;
  }
}

type CacheRow = { id: string; datos: DatosBurocracia; hash_contenido: string | null; updated_at: string };

/**
 * Actualización en background (la dispara after() desde la página):
 * busca la convocatoria y actualiza el caché si el contenido cambió.
 */
export async function actualizarBurocracia(cache: CacheRow | null): Promise<void> {
  const sb = supabaseAdmin();
  const ahora = new Date().toISOString();
  const nuevos = await buscarConvocatoria().catch(() => null);

  if (nuevos) {
    const hash = hashDatos(nuevos);
    if (hash !== cache?.hash_contenido) {
      if (cache) {
        await sb
          .from("burocracia_cache")
          .update({
            datos: nuevos as unknown as Record<string, unknown>,
            hash_contenido: hash,
            fuente_url: nuevos.enlace_boja,
            updated_at: ahora,
          })
          .eq("id", cache.id);
      } else {
        await sb.from("burocracia_cache").insert({
          convocatoria: "OIR-SAS",
          datos: nuevos as unknown as Record<string, unknown>,
          hash_contenido: hash,
          fuente_url: nuevos.enlace_boja,
          fecha_publicacion: null,
        });
      }
      return;
    }
  }
  // sin novedades: solo refrescar la marca de comprobación
  if (cache) {
    await sb.from("burocracia_cache").update({ updated_at: ahora }).eq("id", cache.id);
  } else {
    await sb.from("burocracia_cache").insert({
      convocatoria: "OIR-SAS",
      datos: DATOS_FALLBACK as unknown as Record<string, unknown>,
      hash_contenido: hashDatos(DATOS_FALLBACK),
      fecha_publicacion: null,
      fuente_url: null,
    });
  }
}

/**
 * Datos de burocracia servidos SIEMPRE desde caché (nunca bloquea).
 * Si el caché tiene >7 días devuelve comprobando=true y el caller
 * programa actualizarBurocracia() en background (after()).
 */
export async function getBurocracia(): Promise<{
  datos: DatosBurocracia;
  actualizado: string | null;
  comprobando: boolean;
  cache: CacheRow | null;
}> {
  const sb = supabaseAdmin();

  let cache: CacheRow | null = null;
  try {
    const r = await sb
      .from("burocracia_cache")
      .select("id, datos, hash_contenido, updated_at")
      .eq("convocatoria", "OIR-SAS")
      .maybeSingle();
    cache = r.data as CacheRow | null;
  } catch {
    // tabla no creada (migración 0004): funciona con fallback estático
    return { datos: DATOS_FALLBACK, actualizado: null, comprobando: false, cache: null };
  }

  const caducado =
    !cache || Date.now() - new Date(cache.updated_at).getTime() > DIAS_CACHE * 24 * 3600 * 1000;

  return {
    datos: cache?.datos ?? DATOS_FALLBACK,
    actualizado: cache?.updated_at ?? null,
    comprobando: caducado,
    cache,
  };
}
