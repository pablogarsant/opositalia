import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { getPerfil } from "@/lib/perfil";
import { getPlanUsuario } from "@/lib/plan/datos";
import CalendarioGrid from "@/components/plan/CalendarioGrid";

export default async function CalendarioPage() {
  const user = await currentUser();
  const perfil = user ? await getPerfil(user.id) : null;
  const { inscripcion, sesiones } = perfil
    ? await getPlanUsuario(perfil.id)
    : { inscripcion: null, sesiones: [] };

  if (!inscripcion) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">Sin plan que mostrar</h1>
        <p className="mt-2 text-sm text-ink-2">Genera tu plan y aquí verás el calendario.</p>
        <Link
          href="/onboarding"
          className="mt-5 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-2"
        >
          Crear mi plan
        </Link>
      </div>
    );
  }

  const horas = (inscripcion.config_plan as { horas_sesion?: number })?.horas_sesion ?? 2;

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
            Planificación
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink">Calendario de estudio</h1>
        </div>
        <a
          href="/api/calendario/ics"
          download
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-2 hover:border-border-2 hover:text-ink"
          title="Compatible con Google Calendar y Apple Calendar"
        >
          Exportar (.ics)
        </a>
      </header>

      <CalendarioGrid sesiones={sesiones} horasSesion={horas} />

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-2">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-info" aria-hidden /> Planificada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-ok" aria-hidden /> Completada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-danger" aria-hidden /> Perdida
        </span>
      </div>
    </>
  );
}
