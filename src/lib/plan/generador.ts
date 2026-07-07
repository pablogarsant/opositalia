/**
 * Generador de plan de estudio. Puro e isomorfo: el server lo usa para
 * persistir y el onboarding para el preview. Ciclo por bloque:
 * lecturas de cada tema → repaso del bloque → examen del bloque.
 */

export interface TemaPlan {
  id: string;
  titulo: string;
  horas: number;
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
  intensidad: "ligera" | "media" | "intensa";
}

export interface SesionGenerada {
  tema_id: string | null;
  bloque_id: string;
  fecha_programada: string; // yyyy-mm-dd
  tipo: "lectura" | "repaso" | "examen";
  orden: number;
}

const FACTOR_INTENSIDAD = { ligera: 0.75, media: 1, intensa: 1.25 } as const;

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Nº de sesiones de lectura que necesita un tema según horas y config. */
function lecturasDeTema(tema: TemaPlan, config: ConfigGeneracion): number {
  const base = Math.ceil(tema.horas / config.horas_sesion);
  return Math.max(1, Math.round(base * FACTOR_INTENSIDAD[config.intensidad]));
}

/** Total de sesiones del plan sin fechas (para el preview del onboarding). */
export function contarSesiones(bloques: BloquePlan[], config: ConfigGeneracion): number {
  return bloques.reduce(
    (acc, b) => acc + b.temas.reduce((a, t) => a + lecturasDeTema(t, config), 0) + 2, // + repaso + examen
    0
  );
}

/**
 * Genera las sesiones con fecha, una por día disponible, desde fechaInicio.
 * No trunca en fechaExamen: si no cabe, el caller lo reporta como aviso.
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
  for (const bloque of bloques) {
    for (const tema of bloque.temas) {
      const n = lecturasDeTema(tema, config);
      for (let i = 0; i < n; i++) {
        sesiones.push({
          tema_id: tema.id,
          bloque_id: bloque.id,
          fecha_programada: siguienteFecha(),
          tipo: "lectura",
          orden: orden++,
        });
      }
    }
    sesiones.push({
      tema_id: null,
      bloque_id: bloque.id,
      fecha_programada: siguienteFecha(),
      tipo: "repaso",
      orden: orden++,
    });
    sesiones.push({
      tema_id: null,
      bloque_id: bloque.id,
      fecha_programada: siguienteFecha(),
      tipo: "examen",
      orden: orden++,
    });
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
