import { ExternalLink, RefreshCw } from "lucide-react";
import { after } from "next/server";
import { actualizarBurocracia, getBurocracia } from "@/lib/burocracia";

// dinámico justificado: sirve caché temporal y programa la comprobación
// web en background — el prerender de build dispararía la búsqueda (>60s)
export const dynamic = "force-dynamic";

export default async function BurocraciaPage() {
  const { datos, actualizado, comprobando, cache } = await getBurocracia();
  const hoy = new Date().toISOString().slice(0, 10);

  if (comprobando) {
    // la búsqueda web corre tras servir la respuesta; el próximo render la ve
    after(() => actualizarBurocracia(cache));
  }

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
            Información oficial
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Burocracia · {datos.convocatoria}
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            {datos.especialidad} · {datos.organismo}
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 text-xs text-ink-3">
          {comprobando && <RefreshCw size={11} className="animate-spin" aria-hidden />}
          {comprobando
            ? "Comprobando actualizaciones…"
            : actualizado
              ? `Actualizado ${new Date(actualizado).toLocaleDateString("es-ES")}`
              : "Datos provisionales"}
        </span>
      </header>

      {/* plazas + examen */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Plazas</h2>
          <p className="font-display text-4xl font-bold text-accent">{datos.total_plazas}</p>
          <p className="mt-1 text-sm text-ink-2">
            {datos.plazas_ope} turno libre · {datos.plazas_discapacidad} reserva discapacidad
          </p>
          <div className="mt-4 border-t border-border pt-3 text-sm text-ink-2">
            <p>
              Inscripción: {datos.plazo_inscripcion_inicio} → {datos.plazo_inscripcion_fin}
            </p>
            <p className="mt-1 font-medium text-ink">Examen: {datos.fecha_examen}</p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Estructura del examen</h2>
          <ul className="flex flex-col gap-2 text-sm text-ink-2">
            <li>
              <span className="font-semibold text-ink">{datos.estructura_examen.preguntas}</span>{" "}
              preguntas + {datos.estructura_examen.preguntas_reserva} de reserva
            </li>
            <li>
              <span className="font-semibold text-ink">{datos.estructura_examen.duracion_min} min</span>{" "}
              de duración
            </li>
            <li>Penalización: {datos.estructura_examen.penalizacion}</li>
            <li>Nota mínima: {datos.estructura_examen.nota_minima}</li>
          </ul>
        </section>
      </div>

      {/* timeline */}
      <section className="mb-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-5 text-sm font-semibold text-ink">Cronología del proceso</h2>
        <ol className="relative flex flex-col gap-6 border-l-2 border-border pl-6">
          {datos.timeline.map((hito) => {
            const pasado = hito.completado || hito.fecha <= hoy;
            const esSiguiente = !pasado && datos.timeline.filter((h) => !h.completado && h.fecha > hoy)[0]?.fecha === hito.fecha;
            return (
              <li key={hito.hito} className="relative">
                <span
                  className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 ${
                    pasado
                      ? "border-ok bg-ok"
                      : esSiguiente
                        ? "border-info bg-surface shadow-[0_0_0_3px_var(--info-dim)]"
                        : "border-border-2 bg-surface"
                  }`}
                  aria-hidden
                />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                  {hito.fecha}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink">{hito.hito}</p>
                <p className="text-[13px] text-ink-2">{hito.descripcion}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* requisitos */}
      <section className="mb-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink">Requisitos</h2>
        <ul className="flex flex-col gap-2">
          {datos.requisitos.map((r) => (
            <li key={r} className="flex items-start gap-2 text-sm text-ink-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              {r}
            </li>
          ))}
        </ul>
      </section>

      {datos.enlace_boja && (
        <a
          href={datos.enlace_boja}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
        >
          Ver publicación en el BOJA <ExternalLink size={14} aria-hidden />
        </a>
      )}
    </>
  );
}
