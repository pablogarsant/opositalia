import type { TipoSesion } from "./types";
import { UMBRAL_REFUERZO } from "./types";

export function necesitaRefuerzo(dominio: number): boolean {
  return dominio < UMBRAL_REFUERZO;
}

export function calcularTipoSiguienteSesion(sesionesHechas: number): TipoSesion {
  // Ciclo por bloque: lectura → repaso → examen
  const ciclo: TipoSesion[] = ["lectura", "repaso", "examen"];
  return ciclo[sesionesHechas % 3];
}
