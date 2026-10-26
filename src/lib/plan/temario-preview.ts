import { TEMAS_COMUNES, TEMAS_ESPECIFICOS } from "../../../scripts/temario_boja";
import type { BloquePlan } from "./generador";

/**
 * Temario para el preview del onboarding, derivado del mismo temario_boja
 * que usa el seed oficial (fuente única, ids sintéticos). Dos bloques (común /
 * específica) con los 107 temas y su nº de puntos, para estimar la duración.
 */
function aBloquePlan(id: string, titulo: string, temas: typeof TEMAS_COMUNES): BloquePlan {
  return {
    id,
    titulo,
    temas: temas.map((t) => {
      const puntos = t.subtemas.reduce((a, s) => a + s.puntos.length, 0);
      return { id: String(t.numero), titulo: t.titulo, horas: 2, parte: t.parte, puntos };
    }),
  };
}

export const BLOQUES_PREVIEW: BloquePlan[] = [
  aBloquePlan("comun", "Parte Común", TEMAS_COMUNES),
  aBloquePlan("especifica", "Parte Específica", TEMAS_ESPECIFICOS),
];
