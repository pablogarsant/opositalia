/**
 * Generador de plan de estudio. Puro e isomorfo: el server lo usa para
 * persistir y el onboarding para el preview.
 *
 * Ciclo por tema (temario BOJA de 107 temas):
 *  - Parte común: leer → repasar.
 *  - Parte específica: leer ×N (según nº de puntos y profundidad) → repasar → examinar.
 *  - Fin de cada bloque: 1 simulacro acumulado.
 *  - Fin del temario: 3 simulacros generales.
 */

export interface TemaPlan {
  id: string;
  titulo: string;
  horas: number;
  parte?: "comun" | "especifica";
  puntos?: number; // nº de puntos específicos del tema (peso real)
}

export interface BloquePlan {
  id: string;
  titulo: string;
  temas: TemaPlan[];
}

export interface ConfigGeneracion {
  /** días de la semana disponibles, 0=domingo … 6=sábado (getDay de JS) */
  dias_semana: number[];
  horas_sesion: number;
  /** profundidad del plan: reetiquetada en el onboarding como básica/completa/exhaustiva */
  intensidad: "ligera" | "media" | "intensa";
}

export interface SesionGenerada {
  tema_id: string | null;
  bloque_id: string;
  fecha_programada: string; // yyyy-mm-dd
  tipo: "lectura" | "repaso" | "examen";
  orden: number;
}

// multiplicador de lecturas por profundidad (básica / completa / exhaustiva)
const FACTOR = { ligera: 0.5, media: 1, intensa: 1.5 } as const;

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Nº de sesiones de lectura para un tema específico según puntos y profundidad. */
function lecturasDeTema(tema: TemaPlan, config: ConfigGeneracion): number {
  const puntos = tema.puntos ?? Math.round(tema.horas); // fallback si no hay puntos
  const base = puntos <= 8 ? 1 : 2; // cap 2 lecturas por tema (plan realista)
  return Math.max(1, Math.round(base * FACTOR[config.intensidad]));
}

/**
 * Secuencia de tipos de sesión de un tema (sin fechas).
 * Común: leer → repasar. Específica: leer ×N → examinar (la consolidación
 * por repaso se hace en el simulacro de bloque, no por tema, para que el
 * plan no se dispare con 107 temas).
 */
function sesionesDeTema(tema: TemaPlan, config: ConfigGeneracion): SesionGenerada["tipo"][] {
  if (tema.parte === "comun") return ["lectura", "repaso"];
  return [...Array<"lectura">(lecturasDeTema(tema, config)).fill("lectura"), "examen"];
}

const SIMULACROS_FINALES = 3;

/** Total de sesiones del plan sin fechas (para el preview del onboarding). */
export function contarSesiones(bloques: BloquePlan[], config: ConfigGeneracion): number {
  let total = 0;
  for (const bloque of bloques) {
    for (const tema of bloque.temas) total += sesionesDeTema(tema, config).length;
    total += 1; // simulacro de bloque
  }
  return total + SIMULACROS_FINALES;
}

/**
 * Genera las sesiones con fecha, una por día disponible, desde fechaInicio.
 * No trunca en la fecha objetivo: si no cabe, el caller lo reporta como aviso.
 */
export function generarSesiones(params: {
  bloques: BloquePlan[];
  config: ConfigGeneracion;
  fechaInicio: Date;
}): SesionGenerada[] {
  const { bloques, config, fechaInicio } = params;
  const dias = new Set(config.dias_semana);
  const sesiones: SesionGenerada[] = [];

  const cursor = new Date(fechaInicio);
  const siguienteFecha = (): string => {
    while (!dias.has(cursor.getDay())) cursor.setDate(cursor.getDate() + 1);
    const f = fmt(cursor);
    cursor.setDate(cursor.getDate() + 1);
    return f;
  };

  let orden = 0;
  const push = (tipo: SesionGenerada["tipo"], bloqueId: string, temaId: string | null) =>
    sesiones.push({ tema_id: temaId, bloque_id: bloqueId, fecha_programada: siguienteFecha(), tipo, orden: orden++ });

  for (const bloque of bloques) {
    for (const tema of bloque.temas) {
      for (const tipo of sesionesDeTema(tema, config)) {
        // lectura/repaso/examen del tema apuntan al tema; el simulacro de bloque no
        push(tipo, bloque.id, tema.id);
      }
    }
    push("examen", bloque.id, null); // simulacro acumulado del bloque
  }
  // simulacros generales finales (sobre el último bloque a efectos de FK)
  const ultimoBloque = bloques[bloques.length - 1]?.id;
  if (ultimoBloque) {
    for (let i = 0; i < SIMULACROS_FINALES; i++) push("examen", ultimoBloque, null);
  }
  return sesiones;
}

/**
 * Primer día disponible del usuario sin sesión ya ocupada, a partir de mañana.
 * Para recuperadas y refuerzos.
 */
export function siguienteHueco(
  diasSemana: number[],
  fechasOcupadas: Set<string>,
  desde: Date = new Date()
): string {
  const dias = new Set(diasSemana);
  const cursor = new Date(desde);
  cursor.setDate(cursor.getDate() + 1);
  for (let i = 0; i < 365; i++) {
    if (dias.has(cursor.getDay()) && !fechasOcupadas.has(fmt(cursor))) return fmt(cursor);
    cursor.setDate(cursor.getDate() + 1);
  }
  return fmt(cursor); // ponytail: a un año vista, cualquier día vale
}
