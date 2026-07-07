"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Clock, Sparkles, Target, TrendingUp } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import DominioBar from "@/components/dashboard/DominioBar";

interface Informe {
  semana: { completadas: number; planificadas: number; horas: number; precision: number | null };
  dominios: { bloque_id: string; bloque: string; dominio: number }[];
  criticas: { bloque_id: string; bloque: string; dominio: number }[];
  analisis: string[] | null;
}

export default function InformeSemanal() {
  const router = useRouter();
  const [informe, setInforme] = useState<Informe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ bloque_id: string; bloque: string } | null>(null);
  const [anadiendo, setAnadiendo] = useState(false);

  useEffect(() => {
     
    void fetch("/api/informe")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || json.error) throw new Error(json.error ?? `HTTP ${r.status}`);
        setInforme(json.data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error cargando el informe"));
  }, []);

  const anadirRefuerzo = async (bloqueId: string) => {
    setAnadiendo(true);
    try {
      const res = await fetch("/api/plan/reorganizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "refuerzo", bloque_id: bloqueId }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setModal(null);
      router.push("/plan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo añadir el refuerzo");
      setAnadiendo(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-xl border border-danger/40 bg-danger-dim p-6 text-sm text-ink">
        {error}
      </div>
    );
  }

  if (!informe) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-ink-2">
        Generando tu informe semanal…
      </div>
    );
  }

  const { semana, dominios, criticas, analisis } = informe;

  return (
    <>
      <header className="mb-6">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
          Últimos 7 días
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink">Tu informe semanal</h1>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Sesiones completadas"
          value={String(semana.completadas)}
          valueSuffix={`/${semana.planificadas}`}
          sub={semana.planificadas > semana.completadas ? `${semana.planificadas - semana.completadas} pendientes` : "semana al día"}
        />
        <StatCard icon={Clock} label="Horas de estudio" value={String(semana.horas)} sub="esta semana" />
        <StatCard
          icon={Target}
          label="Precisión exámenes"
          value={semana.precision !== null ? String(semana.precision) : "—"}
          valueSuffix={semana.precision !== null ? "%" : undefined}
          sub={semana.precision !== null ? "media semanal" : "sin simulacros aún"}
        />
        <StatCard icon={TrendingUp} label="Bloques en riesgo" value={String(criticas.length)} sub={`dominio < 65%`} />
      </section>

      <section className="mb-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink">Dominio por bloque</h2>
        <p className="mb-4 text-xs text-ink-3">Toca un bloque para reforzarlo</p>
        {dominios.length === 0 && (
          <p className="text-sm text-ink-2">Aún no hay datos de progreso: completa tu primera sesión.</p>
        )}
        {dominios.map((d) => (
          <button
            key={d.bloque_id}
            type="button"
            onClick={() => setModal({ bloque_id: d.bloque_id, bloque: d.bloque })}
            className="block w-full rounded-lg px-2 py-1 text-left hover:bg-surface-2"
          >
            <DominioBar label={d.bloque} dominio={d.dominio} />
          </button>
        ))}
      </section>

      {analisis && (
        <section className="mb-6 rounded-xl border border-accent/40 bg-accent-dim p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-accent">
            <Sparkles size={15} aria-hidden /> Análisis y recomendaciones
          </h2>
          <ol className="flex flex-col gap-2">
            {analisis.map((rec, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink">
                <span className="font-bold text-accent">{i + 1}.</span> {rec}
              </li>
            ))}
          </ol>
        </section>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`Reforzar ${modal.bloque}`}
          >
            <h3 className="font-display text-lg font-semibold text-ink">{modal.bloque}</h3>
            <p className="mt-1 text-sm text-ink-2">¿Cómo quieres reforzar este bloque?</p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() =>
                  router.push(`/sesion?tema=${encodeURIComponent(modal.bloque)}&tipo=repaso`)
                }
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-2"
              >
                Estudiar ahora
              </button>
              <button
                type="button"
                onClick={() => void anadirRefuerzo(modal.bloque_id)}
                disabled={anadiendo}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink-2 hover:border-border-2 disabled:opacity-50"
              >
                {anadiendo ? "Añadiendo…" : "Añadir al plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
