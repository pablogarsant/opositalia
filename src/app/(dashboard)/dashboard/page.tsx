import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { BookOpen, CalendarDays, Clock, Flame, Play, Target } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import DominioBar from "@/components/dashboard/DominioBar";
import SessionTypeBadge from "@/components/shared/SessionTypeBadge";
import { getPerfil } from "@/lib/perfil";
import { getPlanUsuario } from "@/lib/plan/datos";
import { UMBRAL_REFUERZO } from "@/lib/plan/types";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Hora de España peninsular: la base de usuarias es SAS Andalucía
function saludoPorHora(): string {
  const hora = Number(
    new Intl.DateTimeFormat("es-ES", { hour: "numeric", hour12: false, timeZone: "Europe/Madrid" }).format(new Date())
  );
  if (hora >= 7 && hora < 14) return "Buenos días";
  if (hora >= 14 && hora < 21) return "Buenas tardes";
  return "Buenas noches";
}

// fuera del componente: la regla react-hooks/purity no aplica a helpers
function fechasReferencia() {
  return {
    hoy: new Date().toISOString().slice(0, 10),
    hace7: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
  };
}

export default async function DashboardPage() {
  const user = await currentUser();
  const perfil = user ? await getPerfil(user.id) : null;
  const nombre = perfil?.nombre ?? user?.firstName ?? "opositora";
  const primerNombre = nombre.split(" ")[0];

  const sb = supabaseAdmin();
  const { hoy, hace7 } = fechasReferencia();

  const { inscripcion, sesiones } = perfil
    ? await getPlanUsuario(perfil.id)
    : { inscripcion: null, sesiones: [] };

  const [racha, progreso, estudioSemana, temasTotal] = perfil
    ? await Promise.all([
        sb.from("rachas").select("racha_actual").eq("perfil_id", perfil.id).maybeSingle(),
        sb.from("progreso_temas").select("tema_id, bloque_id, dominio").eq("perfil_id", perfil.id),
        sb.from("sesiones_estudio").select("id, duracion_seg").eq("perfil_id", perfil.id).gte("iniciada_en", hace7),
        sb.from("temas").select("id", { count: "exact" }).limit(1),
      ])
    : [null, null, null, null];

  // precisión: últimas 20 respuestas del usuario
  let precision: number | null = null;
  if (perfil) {
    const sesionesIds = await sb
      .from("sesiones_estudio")
      .select("id")
      .eq("perfil_id", perfil.id)
      .order("iniciada_en", { ascending: false })
      .limit(10);
    const ids = (sesionesIds.data ?? []).map((s) => s.id);
    if (ids.length) {
      const resp = await sb
        .from("respuestas_examen")
        .select("es_correcta, created_at")
        .in("sesion_id", ids)
        .order("created_at", { ascending: false })
        .limit(20);
      const total = resp.data?.length ?? 0;
      if (total > 0) {
        precision = Math.round(((resp.data ?? []).filter((r) => r.es_correcta).length / total) * 100);
      }
    }
  }

  const completadas = sesiones.filter((s) => s.estado === "completada").length;
  const totalTemas = temasTotal?.count ?? 20;
  const horasSemana =
    Math.round(((estudioSemana?.data ?? []).reduce((a, s) => a + (s.duracion_seg ?? 0), 0) / 3600) * 10) / 10;

  const sesionHoy = sesiones.find((s) => s.estado === "pendiente" && s.fecha_programada === hoy);
  const proximas = sesiones.filter((s) => s.estado === "pendiente" && s.fecha_programada > hoy).slice(0, 3);

  // áreas a reforzar: dominios medios por bloque (peores 5)
  const bloquesTitulos = await sb.from("bloques").select("id, titulo");
  const tituloBloque = new Map((bloquesTitulos.data ?? []).map((b) => [b.id, b.titulo]));
  const porBloque = new Map<string, number[]>();
  for (const p of progreso?.data ?? []) {
    if (!p.bloque_id) continue;
    if (!porBloque.has(p.bloque_id)) porBloque.set(p.bloque_id, []);
    porBloque.get(p.bloque_id)!.push(p.dominio ?? 0);
  }
  const areas = [...porBloque.entries()]
    .map(([id, v]) => ({ bloque: tituloBloque.get(id) ?? "?", dominio: Math.round(v.reduce((a, b) => a + b, 0) / v.length) }))
    .sort((a, b) => a.dominio - b.dominio)
    .slice(0, 5);
  const rachaActual = racha?.data?.racha_actual ?? 0;

  return (
    <>
      <header className="mb-6 md:mb-8">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
          Bienvenida de vuelta
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">
          {saludoPorHora()}, {primerNombre}
        </h1>
        <p className="mt-1 text-sm text-ink-2">
          {rachaActual > 0
            ? `Llevas ${rachaActual} ${rachaActual === 1 ? "día" : "días"} de racha. No la rompas hoy.`
            : "Hoy es un buen día para empezar tu racha."}
        </p>
      </header>

      <section aria-label="Resumen de progreso" className="mb-5 grid grid-cols-2 gap-3 md:mb-6 md:gap-4 lg:grid-cols-4">
        <StatCard icon={Flame} label="Racha actual" value={String(rachaActual)} sub={rachaActual === 1 ? "día consecutivo" : "días consecutivos"} />
        <StatCard icon={BookOpen} label="Sesiones completadas" value={String(completadas)} valueSuffix={`/${sesiones.length || totalTemas}`} sub={inscripcion ? "de tu plan" : "sin plan aún"} />
        <StatCard icon={Target} label="Precisión exámenes" value={precision !== null ? String(precision) : "—"} valueSuffix={precision !== null ? "%" : undefined} sub={precision !== null ? "últimas 20 respuestas" : "sin simulacros aún"} />
        <StatCard icon={Clock} label="Horas esta semana" value={String(horasSemana)} sub="de estudio real" />
      </section>

      {/* Sesión de hoy */}
      <section aria-label="Sesión de hoy" className="mb-5 rounded-xl border border-accent/40 bg-gradient-to-br from-accent-dim to-transparent p-5 md:mb-6 md:p-6">
        {sesionHoy ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
                Sesión de hoy
              </p>
              <h2 className="font-display text-lg font-semibold text-ink md:text-xl">
                {sesionHoy.tema_titulo ?? sesionHoy.bloque_titulo ?? "Sesión"}
              </h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-ink-2">
                <SessionTypeBadge type={sesionHoy.tipo} />
                {sesionHoy.bloque_titulo} · 5 fases
                {sesionHoy.es_refuerzo && " · refuerzo"}
              </p>
            </div>
            <Link
              href={`/sesion?tema=${encodeURIComponent(sesionHoy.tema_titulo ?? sesionHoy.bloque_titulo ?? "")}&bloque=${encodeURIComponent(sesionHoy.bloque_titulo ?? "")}`}
              className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-2"
            >
              <Play size={16} aria-hidden />
              Empezar sesión
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
                Sesión de hoy
              </p>
              <h2 className="font-display text-lg font-semibold text-ink">
                {inscripcion ? "No tienes sesión programada hoy" : "Aún no tienes plan de estudio"}
              </h2>
              <p className="mt-1 text-sm text-ink-2">
                {inscripcion
                  ? "Descansa o adelanta la siguiente sesión del plan."
                  : "Configúralo en dos minutos y organiza tu preparación."}
              </p>
            </div>
            <Link
              href={inscripcion ? "/plan" : "/onboarding"}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-2"
            >
              {inscripcion ? "Ver el plan" : "Crear mi plan"}
            </Link>
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <section aria-label="Próximas sesiones" className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Próximas sesiones</h2>
          {proximas.length === 0 ? (
            <p className="text-sm text-ink-2">
              {inscripcion ? "No hay más sesiones pendientes." : "Genera tu plan para verlas aquí."}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {proximas.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2.5">
                  <CalendarDays size={18} className="shrink-0 text-ink-3" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {s.tema_titulo ?? s.bloque_titulo}
                    </p>
                    <p className="text-xs text-ink-3">
                      {new Date(s.fecha_programada + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <SessionTypeBadge type={s.tipo} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Áreas a reforzar" className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Áreas a reforzar</h2>
          {areas.length === 0 ? (
            <p className="text-sm text-ink-2">
              Completa tu primer simulacro y aquí verás qué reforzar (umbral {UMBRAL_REFUERZO}%).
            </p>
          ) : (
            areas.map((a) => <DominioBar key={a.bloque} label={a.bloque} dominio={a.dominio} />)
          )}
        </section>
      </div>
    </>
  );
}
