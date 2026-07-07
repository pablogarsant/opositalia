import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { getPerfil } from "@/lib/perfil";
import { getPlanUsuario } from "@/lib/plan/datos";
import { supabaseAdmin } from "@/lib/supabase/admin";
import PlanLista from "@/components/plan/PlanLista";

export default async function PlanPage() {
  const user = await currentUser();
  const perfil = user ? await getPerfil(user.id) : null;
  const { inscripcion, sesiones } = perfil
    ? await getPlanUsuario(perfil.id)
    : { inscripcion: null, sesiones: [] };

  if (!inscripcion) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <h1 className="font-display text-xl font-semibold text-ink">Aún no tienes plan</h1>
        <p className="mt-2 text-sm text-ink-2">Configúralo en el onboarding para empezar.</p>
        <Link
          href="/onboarding"
          className="mt-5 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-2"
        >
          Crear mi plan
        </Link>
      </div>
    );
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const proximas = sesiones
    .filter((s) => s.estado === "pendiente" || s.fecha_programada >= hoy)
    .slice(0, 20);

  const historial = await supabaseAdmin()
    .from("historial_plan")
    .select("*")
    .eq("inscripcion_id", inscripcion.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const horas = (inscripcion.config_plan as { horas_sesion?: number })?.horas_sesion ?? 2;
  const totalPendientes = sesiones.filter((s) => s.estado === "pendiente").length;

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
            Plan de estudio · OIR 2026
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {totalPendientes} sesiones pendientes
          </h1>
          {inscripcion.fecha_examen && (
            <p className="mt-1 text-sm text-ink-2">Examen: {inscripcion.fecha_examen}</p>
          )}
        </div>
        <a
          href="/api/calendario/ics"
          download
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-2 hover:border-border-2 hover:text-ink"
        >
          Exportar calendario (.ics)
        </a>
      </header>

      <PlanLista
        sesiones={proximas}
        horasSesion={horas}
        historial={historial.data ?? []}
      />
    </>
  );
}
