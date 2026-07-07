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

/** Fallback (datos del prototipo, pendientes de confirmar con la búsqueda web). */
export const DATOS_FALLBACK: DatosBurocracia = {
  convocatoria: "OIR 2026",
  especialidad: "Oftalmólogo/a",
  organismo: "SAS — Servicio Andaluz de Salud",
  total_plazas: 12,
  plazas_ope: 10,
  plazas_discapacidad: 2,
  fecha_examen: "2026-06-14",
  plazo_inscripcion_inicio: "2026-01-15",
  plazo_inscripcion_fin: "2026-02-15",
  enlace_boja: "https://www.juntadeandalucia.es/boja",
  estructura_examen: {
    preguntas: 100,
    preguntas_reserva: 10,
    duracion_min: 120,
    penalizacion: "Cada 3 errores restan 1 acierto",
    nota_minima: 5,
  },
  timeline: [
    { fecha: "2026-01-15", hito: "Apertura de inscripción", descripcion: "Presentación telemática en el portal del SAS", completado: true },
    { fecha: "2026-02-15", hito: "Cierre de inscripción", descripcion: "Último día para presentar solicitud y tasas", completado: true },
    { fecha: "2026-04-30", hito: "Lista provisional de admitidos", descripcion: "Publicación en BOJA y web del SAS", completado: false },
    { fecha: "2026-06-14", hito: "Examen", descripcion: "Prueba tipo test en sede por determinar", completado: false },
  ],
  requisitos: [
    "Título de Médico Especialista en Oftalmología",
    "Nacionalidad española o de un estado miembro de la UE",
    "No haber sido separado del servicio de ninguna administración pública",
    "Abono de tasas o justificante de exención",
  ],
  ultima_actualizacion: "prototipo — pendiente de confirmar con la convocatoria oficial",
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
      "Eres un asistente que verifica convocatorias de oposiciones sanitarias en España. Busca información OFICIAL (BOJA, web del SAS) y responde SOLO con JSON válido, sin markdown.",
    messages: [
      {
        role: "user",
        content: `Busca la convocatoria vigente de la oposición de Oftalmología (OIR / FEA Oftalmología) del SAS Andalucía 2025-2026: plazas, fecha de examen, plazo de inscripción, requisitos, estructura del examen y enlace al BOJA.

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
