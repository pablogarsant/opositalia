"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Brain, FileText, Lightbulb, Map as MapIcon, RefreshCw } from "lucide-react";
import type {
  ContenidoExamen,
  ContenidoLectura,
  ContenidoRepaso,
} from "@/lib/anthropic/sesion";
import { useSesionStore } from "@/stores/sesionStore";
import ChatWidget from "@/components/chat/ChatWidget";
import PhaseRepaso from "./PhaseRepaso";
import PhaseConceptos from "./PhaseConceptos";
import PhaseMapa from "./PhaseMapa";
import PhaseLectura from "./PhaseLectura";
import PhaseExamen from "./PhaseExamen";

interface Props {
  tema: string;
  bloque: string;
}

interface ContenidoCompleto {
  repaso: ContenidoRepaso;
  lectura: ContenidoLectura;
  examen: ContenidoExamen;
  tema_id: string | null;
  bloque_id: string | null;
}

const FASES = [
  { n: 1, nombre: "Repaso", icon: RefreshCw },
  { n: 2, nombre: "Conceptos", icon: Lightbulb },
  { n: 3, nombre: "Mapa mental", icon: MapIcon },
  { n: 4, nombre: "Lectura", icon: BookOpen },
  { n: 5, nombre: "Examen", icon: FileText },
] as const;

async function pedirContenido(tema: string, bloque: string, tipo: string) {
  const res = await fetch("/api/sesion/contenido", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tema, bloque, tipo_sesion: tipo }),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json.data;
}

export default function SesionActiva({ tema, bloque }: Props) {
  const { faseActual, setFase } = useSesionStore();
  const [contenido, setContenido] = useState<ContenidoCompleto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [faseMax, setFaseMax] = useState(1);

  const cargar = useCallback(async () => {
    try {
      // tres generaciones en paralelo (cacheadas tras la primera vez)
      const [repaso, lectura, examen] = await Promise.all([
        pedirContenido(tema, bloque, "repaso"),
        pedirContenido(tema, bloque, "lectura"),
        pedirContenido(tema, bloque, "examen"),
      ]);
      setContenido({
        repaso: repaso.contenido as ContenidoRepaso,
        lectura: lectura.contenido as ContenidoLectura,
        examen: examen.contenido as ContenidoExamen,
        tema_id: lectura.tema_id ?? null,
        bloque_id: lectura.bloque_id ?? null,
      });
      // la sesión siempre arranca en fase 1 (async: no dispara render en cascada)
      setFase(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar la sesión");
    }
  }, [tema, bloque, setFase]);

  useEffect(() => {
    // data-fetch inicial: los setState ocurren tras await (no síncronos);
    // falso positivo de la regla con async callbacks
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  const reintentar = () => {
    setError(null);
    setContenido(null);
    void cargar();
  };

  const avanzar = () => {
    const siguiente = Math.min(faseActual + 1, 5) as 1 | 2 | 3 | 4 | 5;
    setFase(siguiente);
    setFaseMax((m) => Math.max(m, siguiente));
  };

  if (error) {
    return (
      <div className="rounded-xl border border-danger/40 bg-danger-dim p-6">
        <p className="font-medium text-danger">No se pudo preparar la sesión</p>
        <p className="mt-1 text-sm text-ink-2">{error}</p>
        <button
          type="button"
          onClick={reintentar}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-2"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!contenido) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Brain size={40} className="animate-pulse text-accent" aria-hidden />
        <p className="font-display text-lg text-ink">Preparando tu sesión…</p>
        <p className="max-w-sm text-center text-sm text-ink-2">
          La IA está generando flashcards, textos y simulacro a partir del temario. La primera
          vez tarda ~1 minuto; después queda cacheado.
        </p>
      </div>
    );
  }

  return (
    <>
      <header className="mb-5">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
          Sesión activa · {bloque}
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink">{tema}</h1>
      </header>

      {/* tabs de fases */}
      <nav aria-label="Fases de la sesión" className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {FASES.map(({ n, nombre, icon: Icon }) => {
          const activa = faseActual === n;
          const desbloqueada = n <= faseMax;
          return (
            <button
              key={n}
              type="button"
              disabled={!desbloqueada}
              onClick={() => desbloqueada && setFase(n as 1 | 2 | 3 | 4 | 5)}
              aria-current={activa ? "step" : undefined}
              className={`flex min-w-24 shrink-0 flex-col items-center gap-1 rounded-xl border px-4 py-2.5 text-xs transition-colors ${
                activa
                  ? "border-accent bg-accent-dim text-accent"
                  : desbloqueada
                    ? "border-border bg-surface text-ink-2 hover:border-border-2"
                    : "border-border bg-surface text-ink-3 opacity-50"
              }`}
            >
              <Icon size={16} aria-hidden />
              <span className="font-semibold">Fase {n}</span>
              <span>{nombre}</span>
            </button>
          );
        })}
      </nav>

      {/* contenido de la fase */}
      <section className="rounded-xl border border-border bg-surface p-5 md:p-7">
        {faseActual === 1 && <PhaseRepaso flashcards={contenido.repaso.flashcards} onDone={avanzar} />}
        {faseActual === 2 && (
          <PhaseConceptos conceptos={contenido.lectura.conceptos_clave} onDone={avanzar} />
        )}
        {faseActual === 3 && <PhaseMapa mapa={contenido.lectura.mapa_mental} onDone={avanzar} />}
        {faseActual === 4 && <PhaseLectura textos={contenido.lectura.textos} onDone={avanzar} />}
        {faseActual === 5 && (
          <PhaseExamen
            preguntas={contenido.examen.preguntas}
            temaId={contenido.tema_id}
            bloqueId={contenido.bloque_id}
            bloque={bloque}
          />
        )}
      </section>

      {/* consultor IA: disponible fases 1-4, bloqueado en el simulacro */}
      <ChatWidget tema={tema} bloque={bloque} fase={faseActual} />
    </>
  );
}
