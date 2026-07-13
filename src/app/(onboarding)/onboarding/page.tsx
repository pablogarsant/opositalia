"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Check, GraduationCap, Sparkles } from "lucide-react";
import { contarSesiones } from "@/lib/plan/generador";
import { BLOQUES_PREVIEW } from "@/lib/plan/temario-preview";

const DIAS = [
  { n: 1, label: "L" },
  { n: 2, label: "M" },
  { n: 3, label: "X" },
  { n: 4, label: "J" },
  { n: 5, label: "V" },
  { n: 6, label: "S" },
  { n: 0, label: "D" },
];

function fechaPorDefecto(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 12); // "listo en 12 meses" por defecto
  return d.toISOString().slice(0, 10);
}

export default function OnboardingPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [fechaExamen, setFechaExamen] = useState(fechaPorDefecto);
  const [dias, setDias] = useState<number[]>([1, 3, 5]);
  const [horas, setHoras] = useState(2);
  // "intensidad" es el campo del API; en la UI se llama nivel de profundidad
  const [intensidad, setIntensidad] = useState<"ligera" | "media" | "intensa">("media");
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  const preview = useMemo(() => {
    if (!dias.length) return { sesiones: 0, semanas: 0 };
    const sesiones = contarSesiones(BLOQUES_PREVIEW, {
      dias_semana: dias,
      horas_sesion: horas,
      intensidad,
    });
    return { sesiones, semanas: Math.ceil(sesiones / dias.length) };
  }, [dias, horas, intensidad]);

  const toggleDia = (n: number) =>
    setDias((prev) => (prev.includes(n) ? prev.filter((d) => d !== n) : [...prev, n]));

  const generar = async () => {
    setGenerando(true);
    setError(null);
    try {
      const res = await fetch("/api/plan/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curso_slug: "oir-sas-2026",
          fecha_examen: fechaExamen,
          dias_semana: dias,
          horas_sesion: horas,
          intensidad,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setListo(true);
      setTimeout(() => router.push("/dashboard"), 1600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el plan");
      setGenerando(false);
    }
  };

  if (listo) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ok-dim">
          <Check size={32} className="text-ok" aria-hidden />
        </span>
        <h1 className="font-display text-2xl font-semibold text-ink">Plan creado</h1>
        <p className="text-sm text-ink-2">Entrando a tu dashboard…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-10">
      {/* progreso */}
      <div className="mb-8 flex items-center justify-center gap-2" aria-label={`Paso ${paso} de 3`}>
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-2 rounded-full transition-all ${
              n === paso ? "w-8 bg-accent" : n < paso ? "w-2 bg-accent" : "w-2 bg-border-2"
            }`}
            aria-hidden
          />
        ))}
      </div>

      {paso === 1 && (
        <section className="text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-3 w-3 rounded-full bg-accent" aria-hidden />
            <h1 className="font-display text-4xl font-semibold text-ink">Opositalia</h1>
          </div>
          <p className="mb-8 text-lg text-ink-2">Tu academia de oposiciones con IA</p>
          <ul className="mx-auto mb-10 flex max-w-md flex-col gap-4 text-left">
            {[
              { icon: GraduationCap, texto: "Estudia a tu ritmo con un plan que se adapta a tu disponibilidad" },
              { icon: Brain, texto: "IA que refuerza automáticamente lo que se te resiste" },
              { icon: Sparkles, texto: "Contenido generado desde el Kanski y fuentes oficiales" },
            ].map(({ icon: Icon, texto }) => (
              <li key={texto} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-dim">
                  <Icon size={16} className="text-accent" aria-hidden />
                </span>
                <p className="text-sm leading-relaxed text-ink-2">{texto}</p>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setPaso(2)}
            className="rounded-lg bg-accent px-8 py-3 text-sm font-medium text-accent-fg hover:bg-accent-2"
          >
            Empezar
          </button>
        </section>
      )}

      {paso === 2 && (
        <section>
          <h1 className="mb-6 text-center font-display text-2xl font-semibold text-ink">
            Elige tu oposición
          </h1>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setPaso(3)}
              className="flex items-center justify-between rounded-xl border-2 border-accent bg-accent-dim p-5 text-left transition-transform hover:scale-[1.01]"
            >
              <div>
                <p className="font-display text-lg font-semibold text-ink">FEA Oftalmología · SAS Andalucía</p>
                <p className="text-sm text-ink-2">Temario oficial BOJA · 107 temas</p>
              </div>
              <span className="rounded-full bg-ok-dim px-3 py-1 text-xs font-semibold text-ok">
                Disponible
              </span>
            </button>
            {["FEA Medicina Interna", "FEA Neurología"].map((nombre) => (
              <div
                key={nombre}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-5 opacity-60"
              >
                <div>
                  <p className="font-display text-lg font-semibold text-ink-2">{nombre}</p>
                  <p className="text-sm text-ink-3">Andalucía</p>
                </div>
                <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink-3">
                  Próximamente
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {paso === 3 && (
        <section>
          <h1 className="mb-1 text-center font-display text-2xl font-semibold text-ink">
            Configura tu plan de estudio
          </h1>
          <p className="mb-6 text-center text-sm text-ink-2">
            Ciclo por bloque: leer → repasar → examinar
          </p>

          <div className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              ¿Cuándo quieres estar lista?
              <span className="text-xs font-normal text-ink-3">
                Puede que la convocatoria aún no esté publicada — pon la fecha en que quieres tener
                el temario dominado.
              </span>
              <input
                type="date"
                value={fechaExamen}
                onChange={(e) => setFechaExamen(e.target.value)}
                className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
              />
            </label>

            <div>
              <p className="mb-2 text-sm font-medium text-ink">Días disponibles</p>
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
              <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
                Horas por sesión
                <select
                  value={horas}
                  onChange={(e) => setHoras(Number(e.target.value))}
                  className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
                >
                  <option value={1}>1 hora</option>
                  <option value={1.5}>1,5 horas</option>
                  <option value={2}>2 horas</option>
                  <option value={3}>3 horas</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
                Nivel de profundidad
                <select
                  value={intensidad}
                  onChange={(e) => setIntensidad(e.target.value as typeof intensidad)}
                  className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
                >
                  <option value="ligera">Preparación básica</option>
                  <option value="media">Preparación completa</option>
                  <option value="intensa">Preparación exhaustiva</option>
                </select>
              </label>
            </div>

            <div className="rounded-lg bg-accent-dim p-4 text-center text-sm">
              <span className="font-semibold text-accent">
                Tu plan tendrá ~{preview.sesiones} sesiones en ~{preview.semanas} semanas
              </span>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <button
              type="button"
              onClick={() => void generar()}
              disabled={generando || dias.length === 0}
              className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-fg hover:bg-accent-2 disabled:opacity-50"
            >
              {generando ? "Generando tu plan…" : "Generar mi plan"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
