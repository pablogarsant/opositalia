"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { SesionConTema } from "@/lib/plan/datos";
import { googleCalendarUrl } from "@/lib/calendar/ics";
import { hoyMadrid } from "@/lib/plan/sesion-actual";

interface Props {
  sesiones: SesionConTema[];
  horasSesion: number;
}

const DIAS_CABECERA = ["L", "M", "X", "J", "V", "S", "D"];
const COLOR_ESTADO: Record<string, string> = {
  pendiente: "bg-info",
  completada: "bg-ok",
  perdida: "bg-danger",
  saltada: "bg-ink-3",
};

/**
 * Qué se puede hacer con una sesión desde el día abierto. Una perdida no se
 * ofrece: su recuperación ya está en otra fecha y hacerla duplicaría la sesión.
 */
function accionSesion(s: SesionConTema, hoy: string): string | null {
  if (s.estado === "completada") return "Repetir";
  if (s.estado !== "pendiente") return null;
  return s.fecha_programada < hoy ? "Hacer ahora" : "Empezar";
}

export default function CalendarioGrid({ sesiones, horasSesion }: Props) {
  const [mes, setMes] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [diaAbierto, setDiaAbierto] = useState<string | null>(null);

  const porFecha = useMemo(() => {
    const m = new Map<string, SesionConTema[]>();
    for (const s of sesiones) {
      if (!m.has(s.fecha_programada)) m.set(s.fecha_programada, []);
      m.get(s.fecha_programada)!.push(s);
    }
    return m;
  }, [sesiones]);

  const celdas = useMemo(() => {
    const primerDia = new Date(mes);
    // lunes de la primera semana visible
    const inicio = new Date(primerDia);
    inicio.setDate(primerDia.getDate() - ((primerDia.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      return d;
    });
  }, [mes]);

  const hoy = hoyMadrid();
  const color = (s: SesionConTema) =>
    s.estado === "pendiente" && s.fecha_programada < hoy ? "bg-warn" : COLOR_ESTADO[s.estado];
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold capitalize text-ink">
          {mes.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}
            aria-label="Mes anterior"
            className="rounded-lg border border-border p-2 text-ink-2 hover:border-border-2"
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}
            aria-label="Mes siguiente"
            className="rounded-lg border border-border p-2 text-ink-2 hover:border-border-2"
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DIAS_CABECERA.map((d) => (
          <div key={d} className="pb-1 text-center text-[11px] font-semibold uppercase text-ink-3">
            {d}
          </div>
        ))}
        {celdas.map((d) => {
          const clave = fmt(d);
          const delMes = d.getMonth() === mes.getMonth();
          const lista = porFecha.get(clave) ?? [];
          const esHoy = clave === hoy;
          return (
            <button
              key={clave}
              type="button"
              onClick={() => setDiaAbierto(lista.length ? (diaAbierto === clave ? null : clave) : null)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition-colors ${
                esHoy
                  ? "border-accent font-bold text-accent"
                  : "border-transparent hover:border-border"
              } ${delMes ? "text-ink" : "text-ink-3"}`}
            >
              {d.getDate()}
              {lista.length > 0 && (
                <span className="absolute bottom-1.5 flex gap-0.5">
                  {lista.slice(0, 3).map((s) => (
                    <span
                      key={s.id}
                      className={`h-1.5 w-1.5 rounded-full ${color(s)}`}
                      aria-hidden
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {diaAbierto && (
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
            {new Date(diaAbierto + "T00:00:00").toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <ul className="flex flex-col gap-2">
            {(porFecha.get(diaAbierto) ?? []).map((s) => {
              const accion = accionSesion(s, hoy);
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-2 text-sm text-ink">
                  <span className={`h-2 w-2 rounded-full ${color(s)}`} aria-hidden />
                  <span className="capitalize text-ink-3">{s.tipo}:</span>
                  <span className="min-w-0 flex-1 truncate">
                    {s.tema_titulo ?? s.bloque_titulo ?? "Sesión"}
                  </span>
                  {accion ? (
                    <Link
                      href={`/sesion?id=${s.id}`}
                      className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-accent-fg hover:bg-accent-2"
                    >
                      {accion}
                    </Link>
                  ) : (
                    s.estado === "perdida" && <span className="text-xs text-ink-3">Reprogramada</span>
                  )}
                  <a
                    href={googleCalendarUrl(s, horasSesion)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    Google Cal <ExternalLink size={11} aria-hidden />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
