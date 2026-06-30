import { addDays, isWeekend, format } from "date-fns";
import type { ConfigPlan } from "./types";

export function siguienteFechaDisponible(desde: Date, config: ConfigPlan): Date {
  let fecha = addDays(desde, 1);
  const diasValidos = new Set(config.diasSemana);
  while (!diasValidos.has(fecha.getDay())) {
    fecha = addDays(fecha, 1);
  }
  return fecha;
}

export function formatFecha(fecha: Date): string {
  return format(fecha, "yyyy-MM-dd");
}
