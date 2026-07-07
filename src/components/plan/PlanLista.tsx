"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, X } from "lucide-react";
import type { SesionConTema } from "@/lib/plan/datos";
import type { HistorialPlanRow } from "@/types/database";
import { googleCalendarUrl } from "@/lib/calendar/ics";
import SessionTypeBadge from "@/components/shared/SessionTypeBadge";

interface Props {
  sesiones: SesionConTema[];
  horasSesion: number;
  historial: HistorialPlanRow[];
}

const DIA_CORTO = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const ESTADO_ICONO = { pendiente: "📅", completada: "✅", perdida: "❌", saltada: "⏭️" } as const;

function claveSemana(fecha: string): string {
  const d = new Date(fecha + "T00:00:00");
  const lunes = new Date(d);
  lunes.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return lunes.toISOString().slice(0, 10);
}

export default function PlanLista({ sesiones, horasSesion, historial }: Props) {
  const router = useRouter();
  const [marcando, setMarcando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const marcarPerdida = async (id: string) => {
    if (!confirm("¿Marcar esta sesión como perdida? Se reprogramará automáticamente.")) return;
    setMarcando(id);
    try {
      const res = await fetch("/api/plan/reorganizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "perdida", sesion_id: id }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setAviso(`Sesión reprogramada al ${json.data.nueva_fecha}`);
      router.refresh();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo reorganizar");
    } finally {
      setMarcando(null);
    }
  };

  const semanas = new Map<string, SesionConTema[]>();
  for (const s of sesiones) {
    const clave = claveSemana(s.fecha_programada);
    if (!semanas.has(clave)) semanas.set(clave, []);
    semanas.get(clave)!.push(s);
  }

  return (
    <>
      {aviso && (
        <div className="mb-4 rounded-lg border border-warn/30 bg-warn-dim px-4 py-3 text-sm text-ink">
          ⚡ {aviso} — el plan se ha reorganizado
        </div>
      )}

      <div className="flex flex-col gap-6">
        {[...semanas.entries()].map(([lunes, lista]) => (
          <section key={lunes}>
            <h2 className="mb-2 border-b border-border pb-2 text-sm font-semibold text-ink-2">
              Semana del {new Date(lunes + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
            </h2>
            <ul className="flex flex-col gap-1.5">
              {lista.map((s) => {
                const d = new Date(s.fecha_programada + "T00:00:00");
                return (
                  <li
                    key={s.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                      s.es_refuerzo
                        ? "border-warn/40 bg-warn-dim"
                        : s.es_recuperada
                          ? "border-danger/30 bg-danger-dim"
                          : "border-border bg-surface"
                    }`}
                  >
                    <span className="w-9 text-xs font-bold uppercase text-ink-3">
                      {DIA_CORTO[d.getDay()]}
                    </span>
                    <span className="w-12 text-xs text-ink-3">
                      {d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">
                      {s.tema_titulo ?? s.bloque_titulo ?? "Sesión"}
                      {s.es_refuerzo && (
                        <span className="ml-2 rounded-full bg-warn/20 px-2 py-0.5 text-[11px] font-semibold text-warn">
                          Refuerzo
                        </span>
                      )}
                      {s.es_recuperada && (
                        <span className="ml-2 rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-semibold text-danger">
                          Recuperada
                        </span>
                      )}
                    </span>
                    <SessionTypeBadge type={s.tipo} />
                    <span aria-label={`Estado: ${s.estado}`}>{ESTADO_ICONO[s.estado]}</span>
                    <a
                      href={googleCalendarUrl(s, horasSesion)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Añadir a Google Calendar"
                      title="Añadir a Google Calendar"
                      className="rounded p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
                    >
                      <CalendarPlus size={15} aria-hidden />
                    </a>
                    {s.estado === "pendiente" && (
                      <button
                        type="button"
                        onClick={() => void marcarPerdida(s.id)}
                        disabled={marcando === s.id}
                        aria-label="Marcar como perdida"
                        title="Marcar como perdida"
                        className="rounded p-1.5 text-ink-3 hover:bg-danger-dim hover:text-danger disabled:opacity-40"
                      >
                        <X size={15} aria-hidden />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {historial.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-ink">Historial de cambios</h2>
          <ul className="flex flex-col gap-1.5">
            {historial.map((h) => (
              <li key={h.id} className="rounded-lg bg-surface-2 px-3 py-2 text-[13px] text-ink-2">
                <span className="font-semibold capitalize text-ink">{h.tipo}</span> — {h.motivo}
                {h.detalle && <span className="text-ink-3"> · {h.detalle}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
