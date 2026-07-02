import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { BookOpen, CalendarDays, Clock, Flame, Play, Target } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import DominioBar from "@/components/dashboard/DominioBar";
import SessionTypeBadge from "@/components/shared/SessionTypeBadge";
import ProgressBar from "@/components/shared/ProgressBar";
import { getPerfil } from "@/lib/perfil";
import type { TipoSesion } from "@/lib/plan/types";

// ── MOCK Fase 3: estos datos vendrán de progreso_temas, rachas y sesiones_plan ──
const STATS = [
  { icon: Flame, label: "Racha actual", value: "12", sub: "días consecutivos" },
  { icon: BookOpen, label: "Temas completados", value: "18", valueSuffix: "/64", sub: "28% del temario" },
  { icon: Target, label: "Precisión exámenes", value: "74", valueSuffix: "%", sub: "↑ +6% esta semana" },
  { icon: Clock, label: "Horas esta semana", value: "9.5", sub: "meta: 12 h/semana" },
];

const AREAS_REFORZAR = [
  { label: "Neuro-oftalmología", dominio: 42 },
  { label: "Órbita y párpados", dominio: 58 },
  { label: "Tumores oculares", dominio: 61 },
  { label: "Glaucoma", dominio: 76 },
  { label: "Segmento anterior", dominio: 82 },
];

const PROXIMAS_SESIONES: { titulo: string; cuando: string; tipo: TipoSesion }[] = [
  { titulo: "Glaucoma — Intro y epidemiología", cuando: "Mañana · 45 min", tipo: "lectura" },
  { titulo: "Retina — Anatomía y vascularización", cuando: "Jueves · 60 min", tipo: "lectura" },
  { titulo: "Neuro-oftalmología — Vía óptica", cuando: "Viernes · 45 min", tipo: "repaso" },
];
// ────────────────────────────────────────────────────────────────────────────────

// Hora de España peninsular: la base de usuarias es SAS Andalucía
function saludoPorHora(): string {
  const hora = Number(
    new Intl.DateTimeFormat("es-ES", {
      hour: "numeric",
      hour12: false,
      timeZone: "Europe/Madrid",
    }).format(new Date())
  );
  if (hora >= 7 && hora < 14) return "Buenos días";
  if (hora >= 14 && hora < 21) return "Buenas tardes";
  return "Buenas noches";
}

export default async function DashboardPage() {
  const user = await currentUser();
  const perfil = user ? await getPerfil(user.id) : null;
  const nombre = perfil?.nombre ?? user?.firstName ?? "opositora";
  const primerNombre = nombre.split(" ")[0];

  return (
    <>
      {/* Cabecera */}
      <header className="mb-6 md:mb-8">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
          Bienvenida de vuelta
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">
          {saludoPorHora()}, {primerNombre}
        </h1>
        <p className="mt-1 text-sm text-ink-2">
          Llevas 12 días de racha. No la rompas hoy.
        </p>
      </header>

      {/* Stats */}
      <section
        aria-label="Resumen de progreso"
        className="mb-5 grid grid-cols-2 gap-3 md:mb-6 md:gap-4 lg:grid-cols-4"
      >
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      {/* Sesión de hoy */}
      <section
        aria-label="Sesión de hoy"
        className="mb-5 rounded-xl border border-accent/40 bg-gradient-to-br from-accent-dim to-transparent p-5 md:mb-6 md:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
              Sesión de hoy
            </p>
            <h2 className="font-display text-lg font-semibold text-ink md:text-xl">
              Anatomía ocular — Segmento anterior
            </h2>
            <p className="mt-1 text-sm text-ink-2">
              Córnea, cristalino, cámara anterior · 5 fases · ~45 min
            </p>
          </div>
          <Link
            href="/sesion"
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-2"
          >
            <Play size={16} aria-hidden />
            Empezar sesión
          </Link>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-ink-3">
            <span>Progreso del tema</span>
            <span>Fase 1 de 5</span>
          </div>
          <ProgressBar value={0} label="Progreso de la sesión de hoy" />
        </div>
      </section>

      {/* Próximas + Áreas */}
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <section
          aria-label="Próximas sesiones"
          className="rounded-xl border border-border bg-surface p-5"
        >
          <h2 className="mb-4 text-sm font-semibold text-ink">Próximas sesiones</h2>
          <ul className="flex flex-col gap-2">
            {PROXIMAS_SESIONES.map((sesion) => (
              <li
                key={sesion.titulo}
                className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2.5"
              >
                <CalendarDays size={18} className="shrink-0 text-ink-3" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {sesion.titulo}
                  </p>
                  <p className="text-xs text-ink-3">{sesion.cuando}</p>
                </div>
                <SessionTypeBadge type={sesion.tipo} />
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-label="Áreas a reforzar"
          className="rounded-xl border border-border bg-surface p-5"
        >
          <h2 className="mb-4 text-sm font-semibold text-ink">Áreas a reforzar</h2>
          {AREAS_REFORZAR.map((area) => (
            <DominioBar key={area.label} {...area} />
          ))}
        </section>
      </div>
    </>
  );
}
