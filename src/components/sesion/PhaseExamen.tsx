"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { PreguntaExamen } from "@/lib/anthropic/sesion";
import { UMBRAL_REFUERZO } from "@/lib/plan/types";

interface Props {
  preguntas: PreguntaExamen[];
  temaId: string | null;
  bloqueId: string | null;
  bloque: string;
}

const LETRAS = ["A", "B", "C", "D"];

export default function PhaseExamen({ preguntas, temaId, bloqueId, bloque }: Props) {
  const [indice, setIndice] = useState(0);
  const [elegidas, setElegidas] = useState<(number | null)[]>(preguntas.map(() => null));
  const [resultado, setResultado] = useState<{
    dominio: number;
    refuerzo: boolean;
    guardado: boolean;
    error?: string;
  } | null>(null);
  const [inicio] = useState(() => Date.now());
  const [corrigiendo, setCorrigiendo] = useState(false);

  const pregunta = preguntas[indice];
  const ultima = indice === preguntas.length - 1;

  const elegir = (op: number) => {
    setElegidas((prev) => prev.map((v, i) => (i === indice ? op : v)));
  };

  const corregir = async () => {
    setCorrigiendo(true);
    const correctas = preguntas.filter((p, i) => elegidas[i] === p.correcta).length;
    const dominioLocal = Math.round((correctas / preguntas.length) * 100);
    try {
      const res = await fetch("/api/sesion/progreso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tema_id: temaId,
          bloque_id: bloqueId,
          bloque,
          correctas,
          total: preguntas.length,
          duracion_seg: Math.round((Date.now() - inicio) / 1000),
          respuestas: preguntas.map((p, i) => ({
            pregunta: p.enunciado.slice(0, 2000),
            elegida: elegidas[i],
            correcta: p.correcta,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setResultado({
        dominio: json.data.dominio,
        refuerzo: json.data.refuerzo_recomendado,
        guardado: true,
      });
    } catch (e) {
      // el resultado local se muestra aunque falle el guardado
      setResultado({
        dominio: dominioLocal,
        refuerzo: dominioLocal < UMBRAL_REFUERZO,
        guardado: false,
        error: e instanceof Error ? e.message : "no se pudo guardar",
      });
    } finally {
      setCorrigiendo(false);
    }
  };

  if (resultado) {
    return (
      <div>
        <div
          className={`mb-6 rounded-xl border p-6 text-center ${
            resultado.refuerzo ? "border-danger/40 bg-danger-dim" : "border-ok/40 bg-ok-dim"
          }`}
        >
          <p className="font-display text-4xl font-bold text-ink">{resultado.dominio}%</p>
          <p className={`mt-2 font-medium ${resultado.refuerzo ? "text-danger" : "text-ok"}`}>
            {resultado.refuerzo
              ? `Por debajo del umbral (${UMBRAL_REFUERZO}%): se recomienda sesión de refuerzo`
              : "Tema dominado — buen trabajo"}
          </p>
          {!resultado.guardado && (
            <p className="mt-2 text-xs text-warn">
              Resultado no guardado: {resultado.error}
            </p>
          )}
        </div>

        <h3 className="mb-3 font-display text-base font-semibold text-ink">Revisión</h3>
        <div className="flex flex-col gap-4">
          {preguntas.map((p, i) => {
            const acierto = elegidas[i] === p.correcta;
            return (
              <div key={i} className="rounded-lg border border-border bg-surface-2 p-4">
                <div className="flex items-start gap-2">
                  {acierto ? (
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-ok" aria-hidden />
                  ) : (
                    <XCircle size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden />
                  )}
                  <p className="text-sm font-medium text-ink">{p.enunciado}</p>
                </div>
                <p className="mt-2 pl-6 text-[13px] text-ink-2">
                  <span className="font-semibold text-ok">
                    Correcta: {LETRAS[p.correcta]}. {p.opciones[p.correcta]}
                  </span>
                  {!acierto && elegidas[i] !== null && (
                    <span className="text-danger">
                      {" — tu respuesta: "}
                      {LETRAS[elegidas[i]!]}
                    </span>
                  )}
                </p>
                <p className="mt-1.5 pl-6 text-[13px] leading-relaxed text-ink-3">{p.explicacion}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-xs text-ink-3">
        <span>
          Pregunta {indice + 1} de {preguntas.length}
        </span>
        <span className="rounded-full bg-danger-dim px-2.5 py-0.5 font-medium text-danger">
          Simulacro — sin consultor
        </span>
      </div>

      <p className="mb-5 text-base font-medium leading-relaxed text-ink">{pregunta.enunciado}</p>

      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Opciones de respuesta">
        {pregunta.opciones.map((op, i) => {
          const elegida = elegidas[indice] === i;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={elegida}
              onClick={() => elegir(i)}
              className={`flex items-center gap-3 rounded-lg border p-3.5 text-left text-sm transition-colors ${
                elegida
                  ? "border-info bg-info-dim text-ink"
                  : "border-border bg-surface-2 text-ink-2 hover:border-border-2"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  elegida ? "bg-info text-white" : "bg-surface text-ink-3"
                }`}
                aria-hidden
              >
                {LETRAS[i]}
              </span>
              {op}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIndice((i) => Math.max(i - 1, 0))}
          disabled={indice === 0}
          className="rounded-lg border border-border px-4 py-2 text-sm text-ink-2 hover:border-border-2 disabled:opacity-40"
        >
          Anterior
        </button>
        {ultima ? (
          <button
            type="button"
            onClick={() => void corregir()}
            disabled={corrigiendo || elegidas.some((e) => e === null)}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-2 disabled:opacity-50"
          >
            {corrigiendo ? "Corrigiendo…" : "Corregir simulacro"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIndice((i) => i + 1)}
            disabled={elegidas[indice] === null}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-2 disabled:opacity-50"
          >
            Siguiente
          </button>
        )}
      </div>
    </div>
  );
}
