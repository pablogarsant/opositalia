"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { PuntoArbol } from "@/lib/temario";

export interface Fuente {
  documento: string;
  pagina?: string;
}

interface Props {
  punto: PuntoArbol;
  subtemaId: string;
  contexto: string;
  bloque: string;
}

/** Mapeo de markdown → tipografía de lectura (Lora, tablas de verdad). */
const COMPONENTES: Components = {
  table: (props) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props) => (
    <th
      className="border-b-2 border-[var(--accent)] bg-[var(--surface-alt,var(--surface-2))] px-4 py-2 text-left font-semibold"
      {...props}
    />
  ),
  td: (props) => <td className="border-b border-[var(--border)] px-4 py-2 align-top" {...props} />,
  h1: (props) => <h2 className="font-display mt-10 mb-4 border-b border-border pb-2 text-2xl font-semibold" {...props} />,
  h2: (props) => <h2 className="font-display mt-10 mb-4 border-b border-border pb-2 text-2xl font-semibold" {...props} />,
  h3: (props) => <h3 className="font-display mt-8 mb-3 text-xl font-semibold" {...props} />,
  h4: (props) => <h4 className="font-display mt-6 mb-2 text-lg font-semibold" {...props} />,
  p: (props) => <p className="mb-4 leading-[1.75]" {...props} />,
  ul: (props) => <ul className="mb-4 ml-5 list-disc space-y-1.5 leading-[1.75]" {...props} />,
  ol: (props) => <ol className="mb-4 ml-5 list-decimal space-y-1.5 leading-[1.75]" {...props} />,
  strong: (props) => <strong className="font-semibold text-ink" {...props} />,
  blockquote: (props) => (
    <blockquote className="my-5 border-l-2 border-accent pl-4 text-ink-2 italic" {...props} />
  ),
  hr: () => <hr className="my-8 border-border" />,
  code: (props) => <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.9em]" {...props} />,
  img: (props) => (
    <figure className="my-6">
      {/* figuras del corpus: URLs externas sin dimensiones conocidas, next/image no aporta */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="w-full rounded-lg border border-border" alt={props.alt ?? ""} src={props.src as string} />
      {props.alt && <figcaption className="mt-2 text-center text-xs text-ink-3">{props.alt}</figcaption>}
    </figure>
  ),
};

/**
 * Contenido de un punto: lo pide (y cachea en Supabase) la primera vez que
 * entra en pantalla. Vale para los dos modos: en páginas se monta ya visible.
 */
export default function ContenidoPunto({ punto, subtemaId, contexto, bloque }: Props) {
  const [md, setMd] = useState<string | null>(null);
  const [fuentes, setFuentes] = useState<Fuente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const pedido = useRef(false);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;

    const pedir = async () => {
      if (pedido.current) return;
      pedido.current = true;
      try {
        const res = await fetch("/api/temario/formatear", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            punto_id: punto.id,
            subtema_id: subtemaId,
            titulo: punto.titulo,
            contexto,
            bloque,
            keywords: punto.keywords.slice(0, 20),
          }),
        });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
        setMd(json.data.contenido_md as string);
        setFuentes((json.data.fuentes ?? []) as Fuente[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar el contenido");
      }
    };

    // se precarga un poco antes de llegar para que no se note la espera
    const obs = new IntersectionObserver(
      (entradas) => entradas[0]?.isIntersecting && void pedir(),
      { rootMargin: "400px 0px" }
    );
    obs.observe(nodo);
    return () => obs.disconnect();
  }, [punto.id, punto.titulo, punto.keywords, subtemaId, contexto, bloque]);

  return (
    <div ref={ref}>
      {md === null && !error && (
        <div className="flex flex-col gap-3 py-2" aria-label="Cargando contenido">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-surface-2" style={{ width: `${95 - i * 12}%` }} />
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-danger/40 bg-danger-dim px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {md !== null && md.trim() === "" && (
        <p className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-ink-2">
          Todavía no hay material del corpus para este punto. Puedes preguntarle al consultor o
          lanzar una sesión de estudio.
        </p>
      )}

      {md && (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTES}>
          {md}
        </ReactMarkdown>
      )}

      {fuentes.length > 0 && (
        <p className="mt-6 border-t border-border pt-3 text-xs text-ink-3">
          <span className="font-semibold">Fuentes:</span>{" "}
          {fuentes
            .map((f) => (f.pagina ? `${f.documento} (${f.pagina})` : f.documento))
            .join(" · ")}
        </p>
      )}
    </div>
  );
}
