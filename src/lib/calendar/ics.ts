import type { SesionConTema } from "@/lib/plan/datos";

function escapar(texto: string): string {
  return texto.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

const TIPO_LABEL = { lectura: "Leer", repaso: "Repasar", examen: "Examen" } as const;

/**
 * iCalendar con las sesiones del plan: VEVENT a las 08:00 (hora local flotante),
 * duración = horas_sesion, alarma 30 min antes.
 */
export function generateICS(sesiones: SesionConTema[], horasSesion = 2): string {
  const eventos = sesiones.map((s) => {
    const fecha = s.fecha_programada.replace(/-/g, "");
    const titulo = `${TIPO_LABEL[s.tipo]}: ${s.tema_titulo ?? s.bloque_titulo ?? "Sesión"}`;
    const duracionH = Math.floor(horasSesion);
    const duracionM = Math.round((horasSesion - duracionH) * 60);
    return [
      "BEGIN:VEVENT",
      `UID:${s.id}@opositalia`,
      `DTSTART:${fecha}T080000`,
      `DURATION:PT${duracionH}H${duracionM > 0 ? `${duracionM}M` : ""}`,
      `SUMMARY:${escapar(titulo)}`,
      `DESCRIPTION:${escapar(`${s.bloque_titulo ?? ""} · sesión de ${s.tipo} · Opositalia`)}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT30M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapar(titulo)}`,
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Opositalia//Plan de estudio//ES",
    "CALSCALE:GREGORIAN",
    ...eventos,
    "END:VCALENDAR",
  ].join("\r\n");
}

/** URL de Google Calendar (template) para UNA sesión — Google no soporta varias por link. */
export function googleCalendarUrl(sesion: SesionConTema, horasSesion = 2): string {
  const inicio = `${sesion.fecha_programada.replace(/-/g, "")}T080000`;
  const finHora = 8 + Math.floor(horasSesion);
  const finMin = Math.round((horasSesion % 1) * 60);
  const fin = `${sesion.fecha_programada.replace(/-/g, "")}T${String(finHora).padStart(2, "0")}${String(finMin).padStart(2, "0")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${TIPO_LABEL[sesion.tipo]}: ${sesion.tema_titulo ?? sesion.bloque_titulo ?? "Sesión"}`,
    dates: `${inicio}/${fin}`,
    details: `${sesion.bloque_titulo ?? ""} · Opositalia`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
