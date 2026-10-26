/**
 * Selección de la sesión que toca. Puro y sin imports para que
 * `node scripts/check_sesion_actual.mjs` lo pueda cargar directamente.
 * La usan el dashboard y /sesion (al que enlaza el sidebar): misma regla en ambos.
 */

type SesionSeleccionable = { estado: string; fecha_programada: string; orden: number | null };

/** Fecha de hoy (YYYY-MM-DD) en Madrid: la base de usuarias es SAS Andalucía. */
export function hoyMadrid(ahora: Date = new Date()): string {
  // sv-SE formatea como YYYY-MM-DD
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(ahora);
}

/** Semana natural (lunes a domingo, YYYY-MM-DD) que contiene `hoy`. */
export function semanaDe(hoy: string): { lunes: string; domingo: string } {
  const d = new Date(`${hoy}T00:00:00Z`);
  const desdeLunes = (d.getUTCDay() + 6) % 7; // getUTCDay: 0 = domingo
  const dia = (delta: number) => new Date(d.getTime() + delta * 86_400_000).toISOString().slice(0, 10);
  return { lunes: dia(-desdeLunes), domingo: dia(6 - desdeLunes) };
}

/**
 * Pendiente de hoy con menor orden; si no hay, la siguiente pendiente.
 * Las pendientes atrasadas no cuentan: las recoloca /api/plan/reorganizar.
 * null = no queda ninguna pendiente desde hoy (el llamante lo muestra).
 */
export function elegirSesionActual<T extends SesionSeleccionable>(sesiones: T[], hoy: string): T | null {
  const candidatas = sesiones
    .filter((s) => s.estado === "pendiente" && s.fecha_programada >= hoy)
    .sort(
      (a, b) =>
        a.fecha_programada.localeCompare(b.fecha_programada) ||
        (a.orden ?? Number.MAX_SAFE_INTEGER) - (b.orden ?? Number.MAX_SAFE_INTEGER)
    );
  return candidatas[0] ?? null;
}
