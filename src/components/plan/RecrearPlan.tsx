"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { replanificar, type BloquePlan, type ConfigGeneracion, type SesionHecha } from "@/lib/plan/generador";

const DIAS = [
  { n: 1, label: "L" },
  { n: 2, label: "M" },
  { n: 3, label: "X" },
  { n: 4, label: "J" },
  { n: 5, label: "V" },
  { n: 6, label: "S" },
  { n: 0, label: "D" },
];

const CAMPO =
  "rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent";

// fuera del componente: la regla react-hooks/purity no aplica a helpers (usa la fecha actual)
function calcularPreview(bloques: BloquePlan[], hechas: SesionHecha[], config: ConfigGeneracion, fechaExamen: string) {
  const sesiones = replanificar({ bloques, config, fechaInicio: new Date(), hechas });
  const fin = sesiones[sesiones.length - 1]?.fecha_programada;
  const semanas = fin ? Math.ceil((new Date(fin).getTime() - Date.now()) / (7 * 24 * 3600 * 1000)) : 0;
  return { total: sesiones.length, semanas, fin, cabe: !fin || fin <= fechaExamen };
}

interface Props {
  bloques: BloquePlan[];
  hechas: SesionHecha[];
  inicial: ConfigGeneracion & { fecha_examen: string };
}

/**
 * Reabre la configuración del plan con un preview en vivo calculado con la
 * misma función que usa el servidor (replanificar), así lo que se ve es lo que se guarda.
 */
export default function RecrearPlan({ bloques, hechas, inicial }: Props) {
  const router = useRouter();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [fechaExamen, setFechaExamen] = useState(inicial.fecha_examen);
  const [dias, setDias] = useState(inicial.dias_semana);
  const [horas, setHoras] = useState(inicial.horas_sesion);
  const [intensidad, setIntensidad] = useState(inicial.intensidad);
  const [modo, setModo] = useState<"conservar" | "cero">("conservar");
  const [borrarNotas, setBorrarNotas] = useState(false);
  const [confirmo, setConfirmo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(
    () =>
      dias.length
        ? calcularPreview(
            bloques,
            modo === "cero" ? [] : hechas,
            { dias_semana: dias, horas_sesion: horas, intensidad },
            fechaExamen
          )
        : null,
    [bloques, hechas, modo, dias, horas, intensidad, fechaExamen]
  );

  const toggleDia = (n: number) =>
    setDias((prev) => (prev.includes(n) ? prev.filter((d) => d !== n) : [...prev, n]));

  const recrear = async () => {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/plan/recrear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo,
          borrar_notas: modo === "cero" && borrarNotas,
          confirmo_borrado: modo === "cero" && confirmo,
          fecha_examen: fechaExamen,
          dias_semana: dias,
          horas_sesion: horas,
          intensidad,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      dialogo.current?.close();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo recrear el plan");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => dialogo.current?.showModal()}
        className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-2 hover:border-border-2 hover:text-ink"
      >
        Recrear plan
      </button>
      <dialog
        ref={dialogo}
        aria-labelledby="recrear-titulo"
        className="m-auto w-full max-w-lg rounded-xl border border-border bg-surface p-0 text-ink backdrop:bg-ink/30"
      >
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="recrear-titulo" className="font-display text-xl font-semibold">
                Recrear el plan
              </h2>
              <p className="mt-1 text-sm text-ink-2">Cambia la configuración y elige qué pasa con lo que ya llevas.</p>
            </div>
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              aria-label="Cerrar"
              className="rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Qué hacer con tu progreso</legend>
            {(
              [
                [
                  "conservar",
                  "Conservar mi progreso",
                  `Se quedan tus ${hechas.length} sesiones completadas, el dominio, favoritos y notas. Las pendientes se reparten de nuevo desde hoy.`,
                ],
                [
                  "cero",
                  "Empezar de cero",
                  "Plan nuevo desde hoy. Se borran sesiones hechas, dominio, racha y favoritos.",
                ],
              ] as const
            ).map(([valor, titulo, texto]) => (
              <label
                key={valor}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${
                  modo === valor ? "border-accent bg-accent-dim" : "border-border bg-surface-2"
                }`}
              >
                <input
                  type="radio"
                  name="modo"
                  checked={modo === valor}
                  onChange={() => {
                    setModo(valor);
                    setConfirmo(false);
                  }}
                  className="mt-0.5 accent-[var(--accent)]"
                />
                <span>
                  <span className="block font-medium">{titulo}</span>
                  <span className="text-ink-2">{texto}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {modo === "cero" && (
            <div className="flex flex-col gap-2 rounded-lg border border-danger/40 bg-danger-dim p-3 text-sm">
              <label className="flex gap-2">
                <input type="checkbox" checked={borrarNotas} onChange={(e) => setBorrarNotas(e.target.checked)} />
                Borrar también mis notas de la agenda
              </label>
              <label className="flex gap-2 font-medium text-danger">
                <input type="checkbox" checked={confirmo} onChange={(e) => setConfirmo(e.target.checked)} />
                Entiendo que el progreso{borrarNotas ? ", los favoritos y las notas" : " y los favoritos"} se borran
                y no se pueden recuperar
              </label>
            </div>
          )}

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Fecha objetivo
            <input type="date" value={fechaExamen} onChange={(e) => setFechaExamen(e.target.value)} className={CAMPO} />
          </label>

          <div>
            <p className="mb-2 text-sm font-medium">Días disponibles</p>
            <div className="flex gap-2">
              {DIAS.map(({ n, label }) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggleDia(n)}
                  aria-pressed={dias.includes(n)}
                  className={`h-10 w-10 rounded-lg border text-sm font-semibold transition-colors ${
                    dias.includes(n)
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border bg-surface-2 text-ink-2 hover:border-border-2"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Horas por sesión
              <select value={horas} onChange={(e) => setHoras(Number(e.target.value))} className={CAMPO}>
                <option value={1}>1 hora</option>
                <option value={1.5}>1,5 horas</option>
                <option value={2}>2 horas</option>
                <option value={3}>3 horas</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Nivel de profundidad
              <select
                value={intensidad}
                onChange={(e) => setIntensidad(e.target.value as typeof intensidad)}
                className={CAMPO}
              >
                <option value="ligera">Preparación básica</option>
                <option value="media">Preparación completa</option>
                <option value="intensa">Preparación exhaustiva</option>
              </select>
            </label>
          </div>

          <p className="rounded-lg bg-accent-dim p-4 text-sm" aria-live="polite">
            {preview ? (
              <>
                <span className="font-semibold text-accent">
                  {preview.total} sesiones en ~{preview.semanas} semanas
                </span>
                {preview.fin && <span className="text-ink-2">, hasta el {preview.fin}.</span>}
                {!preview.cabe && (
                  <span className="mt-1 block text-danger">
                    Termina después de tu fecha objetivo: añade días o baja la profundidad.
                  </span>
                )}
              </>
            ) : (
              <span className="text-ink-2">Elige al menos un día.</span>
            )}
          </p>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="button"
            onClick={() => void recrear()}
            disabled={guardando || !dias.length || (modo === "cero" && !confirmo)}
            className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-fg hover:bg-accent-2 disabled:opacity-50"
          >
            {guardando
              ? "Recreando el plan…"
              : modo === "cero"
                ? "Borrar y empezar de cero"
                : "Recrear conservando mi progreso"}
          </button>
        </div>
      </dialog>
    </>
  );
}
