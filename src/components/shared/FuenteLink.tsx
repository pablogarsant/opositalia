"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import type { FragmentoFuente } from "@/app/api/fuentes/route";
import type { Fuente } from "@/lib/contenido/formatear";

/**
 * Nombre de una fuente que abre su texto original (chunks_rag.contenido, sin IA)
 * en un panel lateral. Sin chunk_ids (cachés antiguas) se queda en texto plano.
 */
export default function FuenteLink({ fuente }: { fuente: Fuente }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [fragmentos, setFragmentos] = useState<FragmentoFuente[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const etiqueta = fuente.pagina ? `${fuente.documento} (${fuente.pagina})` : fuente.documento;

  if (!fuente.chunk_ids?.length) return <span>{etiqueta}</span>;

  const abrir = async () => {
    dialogo.current?.showModal();
    if (fragmentos) return;
    try {
      const res = await fetch(`/api/fuentes?ids=${fuente.chunk_ids!.join(",")}`);
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setFragmentos(json.data as FragmentoFuente[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el texto original");
    }
  };

  const primero = fragmentos?.[0];

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="underline decoration-border-2 underline-offset-2 hover:text-accent hover:decoration-accent focus-visible:outline-2 focus-visible:outline-accent"
      >
        {etiqueta}
      </button>
      <dialog
        ref={dialogo}
        aria-label={`Texto original: ${fuente.documento}`}
        // clic en el fondo cierra; el contenido para la propagación
        onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
        className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-xl bg-surface p-0 text-ink backdrop:bg-ink/30"
      >
        <div className="flex h-full flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div>
              <h2 className="font-display text-lg font-semibold leading-snug">{fuente.documento}</h2>
              {primero?.capitulo && <p className="mt-0.5 text-sm text-ink-2">{primero.capitulo}</p>}
              <p className="mt-2 text-xs leading-relaxed text-ink-3">
                Texto tal cual está en el corpus, sin reescribir.
                {primero?.paginas &&
                  ` Páginas ${primero.paginas[0]}–${primero.paginas[1]}: es el tramo del documento del que sale el fragmento, no la página exacta.`}
                {primero?.traducido && " Traducido del inglés al incorporarlo al corpus."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              aria-label="Cerrar"
              className="rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X size={18} aria-hidden />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {error && <p className="text-sm text-danger">No se pudo cargar el texto original: {error}</p>}
            {!fragmentos && !error && <p className="animate-pulse text-sm text-ink-3">Cargando el texto original…</p>}
            {fragmentos?.map((f, i) => (
              <blockquote
                key={f.id}
                className={`border-l-2 border-accent pl-4 font-display text-[15px] leading-[1.8] whitespace-pre-line text-ink-2 ${i ? "mt-8" : ""}`}
              >
                {f.contenido}
              </blockquote>
            ))}
          </div>
        </div>
      </dialog>
    </>
  );
}
