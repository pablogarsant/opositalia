export type TipoSesion = "lectura" | "repaso" | "examen";
export type EstadoSesion = "pendiente" | "completada" | "perdida" | "saltada";

export interface SesionPlan {
  id: string;
  inscripcionId: string;
  temaId: string;
  bloqueId: string;
  fechaProgramada: string;
  tipo: TipoSesion;
  estado: EstadoSesion;
  esRefuerzo: boolean;
  esRecuperada: boolean;
  orden: number;
}

export interface ConfigPlan {
  diasSemana: number[];
  horasSesion: number;
  intensidad: "baja" | "media" | "alta";
}

export const UMBRAL_REFUERZO = 65;
export const UMBRAL_AVANCE = 70;
