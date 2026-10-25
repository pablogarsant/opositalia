"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown } from "lucide-react";
import type { Fuente } from "@/lib/contenido/formatear";
import FavoritoButton from "@/components/shared/FavoritoButton";
import FuenteLink from "@/components/shared/FuenteLink";
import { COMPONENTES } from "@/components/temario/ContenidoPunto";

export interface PuntoLectura {
  id: string;
  titulo: string;
  subtema: string;
}

interface Props {
  puntos: PuntoLectura[];
  bloque: string;
  onDone: () => void;
}

/** Texto de un punto: se pide al abrirlo y se pinta según llega el stream. */
function LecturaPunto({ punto, bloque }: { punto: PuntoLectura; bloque: string }) {
  const [markdown, setMarkdown] = useState("");
  const [fuentes, setFuentes] = useState<Fuente[]>([]);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/sesion/punto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ punto_id: punto.id }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.error ?? `HTTP ${res.status}`);
        }
        setFuentes(JSON.parse(decodeURIComponent(res.headers.get("X-Fuentes") ?? "%5B%5D")));
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const trozo = decoder.decode(value, { stream: true });
          setMarkdown((prev) => prev + trozo);
        }
        setEstado("listo");
      } catch (e) {
        if (ctrl.signal.aborted) return;
        setError(e instanceof Error ? e.message : "No se pudo cargar la lectura");
        setEstado("error");
      }
    })();
    return () => ctrl.abort();
  }, [punto.id]);

  if (estado === "error") {
    return <p className="text-sm text-danger">No se pudo cargar la lectura: {error}</p>;
  }

  return (
    <div>
      {!markdown && <p className="animate-pulse text-sm text-ink-3">Preparando la lectura del punto…</p>}
      <div className="text-[15px] text-ink-2">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTES}>
          {markdown}
        </ReactMarkdown>
      </div>
      {estado === "listo" && (
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3 border-t border-border pt-3">
          {fuentes.length > 0 && (
            <ul className="text-xs text-ink-3">
              {fuentes.map((f) => (
                <li key={`${f.documento}|${f.pagina ?? ""}`}>
                  <FuenteLink fuente={f} />
                </li>
              ))}
            </ul>
          )}
          <FavoritoButton
            tipo="texto"
            titulo={punto.titulo}
            contenido={{ titulo: punto.titulo, cuerpo: markdown }}
            bloque={bloque}
          />
        </div>
      )}
    </div>
  );
}

export default function PhaseLectura({ puntos, bloque, onDone }: Props) {
  // el primero abierto; cada punto genera su texto solo cuando se abre
  const [abiertos, setAbiertos] = useState<Set<string>>(() => new Set(puntos.slice(0, 1).map((p) => p.id)));
  const alternar = (id: string) =>
    setAbiertos((prev) => {
      const sig = new Set(prev);
      if (sig.has(id)) sig.delete(id);
      else sig.add(id);
      return sig;
    });

  return (
    <div>
      <h2 className="mb-1 font-display text-lg font-semibold text-ink">Lectura por puntos</h2>
      <p className="mb-5 text-sm text-ink-2">
        Abre cada punto para leerlo. La primera vez se redacta a partir de las fuentes y tarda unos segundos.
      </p>
      {puntos.length === 0 ? (
        <p className="text-sm text-ink-2">
          Esta sesión no está ligada a un tema del temario, así que no hay puntos que leer.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {puntos.map((p) => {
            const abierto = abiertos.has(p.id);
            return (
              <article key={p.id} className="rounded-lg border border-border bg-surface-2">
                <button
                  type="button"
                  onClick={() => alternar(p.id)}
                  aria-expanded={abierto}
                  className="flex w-full items-start justify-between gap-3 p-4 text-left"
                >
                  <span>
                    <span className="block text-[11px] uppercase tracking-[0.08em] text-ink-3">{p.subtema}</span>
                    <span className="font-display text-base font-semibold text-ink">{p.titulo}</span>
                  </span>
                  <ChevronDown
                    size={18}
                    aria-hidden
                    className={`mt-1 shrink-0 text-ink-3 transition-transform ${abierto ? "rotate-180" : ""}`}
                  />
                </button>
                {abierto && (
                  <div className="px-5 pb-5">
                    <LecturaPunto punto={p} bloque={bloque} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      <button
        type="button"
        onClick={onDone}
        className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-2"
      >
        Empezar el simulacro
      </button>
    </div>
  );
}
