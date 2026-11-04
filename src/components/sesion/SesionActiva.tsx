"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Brain, FileText, Lightbulb, Map as MapIcon, RefreshCw } from "lucide-react";
import type { ContenidoExamen, ContenidoLectura } from "@/lib/anthropic/sesion";
import type { TarjetaRepaso } from "@/lib/sesion/banco";
import { useSesionStore } from "@/stores/sesionStore";
import { useChatDetalle } from "@/hooks/useChatDetalle";
import PhaseRepaso from "./PhaseRepaso";
import PhaseConceptos from "./PhaseConceptos";
import PhaseMapa from "./PhaseMapa";
import PhaseLectura, { type PuntoLectura } from "./PhaseLectura";
import PhaseExamen from "./PhaseExamen";

interface Props {
  tema: string;
  bloque: string;
  // de sesiones_plan; sin ellos es una sesión libre (refuerzo desde el informe)
  temaId?: string | null;
  sesionPlanId?: string;
  // solo si no es la sesión normal de hoy: atrasada, adelantada o repetida
  aviso?: string;
  // puntos del tema para la lectura de la fase 4 (vacío en sesiones libres)
  puntos?: PuntoLectura[];
}

interface ContenidoCompleto {
  tarjetas: TarjetaRepaso[];
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

async function pedirContenido(tema: string, bloque: string, tipo: string, temaId: string | null) {
  const res = await fetch("/api/sesion/contenido", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tema, bloque, tipo_sesion: tipo, tema_id: temaId }),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json.data;
}

async function pedirTarjetas(): Promise<TarjetaRepaso[]> {
  const res = await fetch("/api/sesion/repaso");
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json.data.tarjetas;
}

export default function SesionActiva({
  tema,
  bloque,
  temaId = null,
  sesionPlanId,
  aviso,
  puntos = [],
}: Props) {
  const { faseActual, setFase } = useSesionStore();
  const [contenido, setContenido] = useState<ContenidoCompleto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [faseMax, setFaseMax] = useState(1);
  // el doble efecto de StrictMode pagaría dos veces un lote nuevo.
  // ponytail: dos pestañas a la vez aún pueden generar dos lotes; el coste es de 0,12 $ como mucho
  const cargando = useRef(false);

  // el consultor global vive en el layout: aquí solo se publica qué se estudia
  useChatDetalle({ tema_titulo: tema, bloque });

  const cargar = useCallback(async () => {
    if (cargando.current) return;
    cargando.current = true;
    try {
      // en paralelo; solo se paga lo que aún no existe
      const [tarjetas, lectura, examen] = await Promise.all([
        pedirTarjetas(),
        pedirContenido(tema, bloque, "lectura", temaId),
        pedirContenido(tema, bloque, "examen", temaId),
      ]);
      setContenido({
        tarjetas,
        lectura: lectura.contenido as ContenidoLectura,
        examen: examen.contenido as ContenidoExamen,
        tema_id: lectura.tema_id ?? null,
        bloque_id: lectura.bloque_id ?? null,
      });
      // sin nada que repasar (primera sesión) se empieza en la fase 2
      const inicio = tarjetas.length ? 1 : 2;
      setFase(inicio);
      setFaseMax(inicio);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar la sesión");
    } finally {
      cargando.current = false;
    }
  }, [tema, bloque, temaId, setFase]);

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
          Preparando las tarjetas de repaso, los conceptos y el simulacro. Si hay que generar
          material nuevo, tarda ~1 minuto.
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
        {aviso && <p className="mt-1 text-sm text-ink-2">{aviso}</p>}
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
        {faseActual === 1 && (
          <PhaseRepaso flashcards={contenido.tarjetas} bloque={bloque} onDone={avanzar} />
        )}
        {faseActual === 2 && (
          <PhaseConceptos conceptos={contenido.lectura.conceptos_clave} onDone={avanzar} />
        )}
        {faseActual === 3 && <PhaseMapa mapa={contenido.lectura.mapa_mental} onDone={avanzar} />}
        {faseActual === 4 && (
          <PhaseLectura puntos={puntos} bloque={bloque} onDone={avanzar} />
        )}
        {faseActual === 5 && (
          <PhaseExamen
            preguntas={contenido.examen.preguntas}
            temaId={contenido.tema_id}
            bloqueId={contenido.bloque_id}
            bloque={bloque}
            sesionPlanId={sesionPlanId}
          />
        )}
      </section>
    </>
  );
}
