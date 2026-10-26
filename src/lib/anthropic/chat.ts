import { anthropic, MODEL } from "./client";
import { formatearContexto, searchRag } from "@/lib/rag";
import { ENLACE_SAS, getBurocracia } from "@/lib/burocracia";

export interface MensajeChat {
  role: "user" | "assistant";
  content: string;
}

/** Lo que el widget global manda como contexto de pantalla. */
export interface ContextoChat {
  pantalla?: string | null;
  tema_id?: string | null;
  tema_titulo?: string | null;
  punto_id?: string | null;
  punto_titulo?: string | null;
  bloque?: string | null;
  fase_sesion?: number | null;
}

const SYSTEM_CONSULTOR = `Eres el asistente de estudio de Opositalia, experto en oftalmología clínica para la oposición OIR del SAS Andalucía. Respondes tanto dudas del temario como dudas sobre cómo funciona la propia aplicación y sobre la convocatoria. Responde de forma directa, concisa y en español. Usa negritas para términos clave. Cuando cites datos clínicos importantes menciona la fuente si la conoces (Kanski, Boyd, guías SAS). Nunca uses disclaimers sobre el origen de la información.

Reglas de estilo:
- Nunca digas "buena pregunta" ni valides la pregunta antes de responder.
- No uses emojis salvo que el usuario los use primero.
- Respuestas de 2-6 frases salvo que pidan desarrollo.
- No inventes datos clínicos, dosis ni clasificaciones.
- Si preguntan por la app o la convocatoria, responde con los bloques de referencia de abajo; no inventes funcionalidades ni fechas.`;

/** Descripción funcional para que el chat sepa explicar la propia app. */
const SOBRE_LA_APP = `== CÓMO FUNCIONA OPOSITALIA ==
Opositalia prepara la oposición FEA Oftalmología del SAS con un plan adaptativo y sesiones guiadas por IA sobre el temario oficial BOJA (2 bloques → 107 temas → 291 subtemas → 982 puntos específicos).

Secciones (menú lateral):
- Dashboard: racha, sesiones completadas, precisión en exámenes, horas de la semana, la sesión de hoy, próximas sesiones y áreas a reforzar.
- Plan de estudio: el calendario de sesiones generado en el onboarding a partir de la fecha de examen, los días y las horas disponibles. Se puede reorganizar.
- Temario: el temario oficial en dos vistas — árbol (índice navegable con buscador y filtros) y grafo (mapa tipo Obsidian con las conexiones entre temas). Desde cualquier punto se abre la vista libro de lectura.
- Vista libro (/temario/[tema]): lectura cómoda del tema con índice lateral, modo scroll continuo o modo páginas, tablas y fuentes.
- Sesión: la sesión de estudio en 5 fases — 1 Repaso (flashcards), 2 Conceptos clave, 3 Mapa mental, 4 Lectura, 5 Examen (simulacro). El asistente está disponible en las fases 1-4 y se bloquea en la fase 5 para que el simulacro sea realista.
- Calendario: vista mensual de las sesiones, con exportación a Google Calendar y .ics.
- Informe semanal: qué se ha estudiado, precisión, áreas flojas y sesiones de refuerzo sugeridas.
- Favoritos: flashcards, ideas clave, mnemotecnias y preguntas guardadas.
- Notas: apuntes propios.
- Burocracia: datos de la convocatoria (plazas, plazos, estructura del examen, timeline), actualizados desde BOE/BOJA.

Conceptos:
- Dominio de un tema o punto: porcentaje 0-100 que mide cuánto se domina. Sube con las respuestas correctas del simulacro y las sesiones completadas. A partir del 75% el punto cuenta como dominado (verde); entre 1 y 74% está en progreso (ámbar); 0% sin empezar.
- Reorganización del plan: si se acumulan sesiones pendientes o hay áreas por debajo del umbral de refuerzo, el plan reprograma las sesiones atrasadas e inserta sesiones de refuerzo de los bloques más flojos.
- Paletas: 5 temas visuales (cielo, salvia, arena, niebla, noche) desde el selector de la barra superior.`;

/** Heurística barata: ¿la pregunta va de la convocatoria? */
function preguntaDeConvocatoria(mensaje: string): boolean {
  return /plaza|convocatoria|oposici[oó]n|examen oficial|fecha.*examen|examen.*fecha|inscripci[oó]n|plazo|requisit|boja|boe|m[eé]rito|baremo|nota de corte|penaliza|cu[aá]ntas preguntas|estructura del examen|tribunal|admitid/i.test(
    mensaje
  );
}

function bloqueBurocracia(datos: Awaited<ReturnType<typeof getBurocracia>>["datos"]): string {
  const e = datos.estructura_examen;
  return `== DATOS REALES DE LA CONVOCATORIA ==
Convocatoria: ${datos.convocatoria} — ${datos.especialidad} (${datos.organismo}).
Estado: ${datos.estado}
Plazas: ${datos.total_plazas} totales (${datos.plazas_ope} turno libre, ${datos.plazas_promocion_interna} promoción interna; ${datos.plazas_discapacidad} reservadas a discapacidad).
Tasa: ${datos.tasa.general} € (${datos.tasa.telematica} € por vía telemática).
Inscripción: ${datos.plazo_inscripcion_inicio} → ${datos.plazo_inscripcion_fin}.
Fecha de examen: ${datos.fecha_examen}.
Examen: ${e.preguntas} preguntas (${e.teoricas} teóricas + ${e.practicas} prácticas) + ${e.preguntas_reserva} de reserva, ${e.duracion_min} minutos, ${e.penalizacion}. Nota mínima: ${e.nota_minima}.
Requisitos: ${datos.requisitos.join("; ")}.
Hitos: ${datos.timeline.map((t) => `${t.fecha} — ${t.hito}${t.completado ? " (hecho)" : ""}`).join(" | ")}.
Enlace oficial: ${ENLACE_SAS}.
Última actualización: ${datos.ultima_actualizacion}.`;
}

/** Frase de contexto de pantalla para el system prompt. */
function bloqueContexto(ctx: ContextoChat): string {
  const partes = [`El usuario está actualmente en: ${ctx.pantalla ?? "dashboard"}.`];
  if (ctx.tema_titulo) partes.push(`Está consultando: ${ctx.tema_titulo}.`);
  if (ctx.punto_titulo) partes.push(`Concretamente el punto: ${ctx.punto_titulo}.`);
  if (ctx.fase_sesion) partes.push(`Va por la fase ${ctx.fase_sesion} de la sesión.`);
  partes.push(
    "Prioriza ese contexto al buscar información, pero responde cualquier pregunta que te haga aunque no tenga que ver con lo que está viendo."
  );
  return partes.join(" ");
}

/**
 * Chatbot con contexto RAG y fallback en dos niveles:
 * bloque → corpus completo → conocimiento general (sin avisar al usuario).
 * Añade la descripción funcional de la app y, si la pregunta lo pide,
 * los datos reales de la convocatoria desde burocracia_cache.
 */
export async function streamChatConRag(params: {
  mensaje: string;
  contexto?: ContextoChat;
  historial?: MensajeChat[];
}) {
  const { mensaje, contexto = {}, historial = [] } = params;
  const bloque = contexto.bloque ?? null;
  // lo que está mirando afina la búsqueda: punto > tema
  const foco = contexto.punto_titulo ?? contexto.tema_titulo ?? null;
  const consulta = foco ? `${mensaje}\n(contexto: ${foco})` : mensaje;

  // el chat responde igual sin RAG o sin burocracia, pero el fallo queda en el log
  const sinEso =
    <T,>(que: string, valor: T) =>
    (e: unknown): T => {
      console.error(`chat: ${que} falló, se responde sin ello:`, e instanceof Error ? e.message : e);
      return valor;
    };

  const [chunksIniciales, burocracia] = await Promise.all([
    searchRag(consulta, bloque, 6).catch(sinEso(`searchRag bloque=${bloque ?? "-"}`, [])),
    preguntaDeConvocatoria(mensaje)
      ? getBurocracia().catch(sinEso("getBurocracia", null))
      : Promise.resolve(null),
  ]);

  let chunks = chunksIniciales;
  if (chunks.length === 0 && bloque) {
    // el tema puede estar cubierto por otro bloque del corpus
    chunks = await searchRag(consulta, null, 6).catch(sinEso("searchRag sin bloque", []));
  }
  const referencia = formatearContexto(chunks);

  const system = [
    SYSTEM_CONSULTOR,
    `\n${bloqueContexto(contexto)}`,
    `\n${SOBRE_LA_APP}`,
    burocracia ? `\n${bloqueBurocracia(burocracia.datos)}` : "",
    referencia ? `\n== MATERIAL DE REFERENCIA ==\n${referencia}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return anthropic.messages.stream({
    model: MODEL,
    max_tokens: 1500,
    system,
    messages: [...historial.slice(-10), { role: "user", content: mensaje }],
  });
}
