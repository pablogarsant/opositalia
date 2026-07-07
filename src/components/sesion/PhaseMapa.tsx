"use client";

import type { MapaMental } from "@/lib/anthropic/sesion";

interface Props {
  mapa: MapaMental;
  onDone: () => void;
}

export default function PhaseMapa({ mapa, onDone }: Props) {
  return (
    <div>
      <h2 className="mb-5 font-display text-lg font-semibold text-ink">Mapa mental</h2>

      <div className="mb-5 flex justify-center">
        <span className="rounded-xl border border-accent bg-accent-dim px-5 py-2.5 text-sm font-bold text-accent">
          {mapa.central}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mapa.ramas.map((rama) => (
          <div key={rama.titulo} className="rounded-lg border border-border bg-surface-2 p-4">
            <p className="mb-2 text-sm font-semibold text-info">{rama.titulo}</p>
            <ul className="flex flex-col gap-1.5">
              {rama.hijos.map((h) => (
                <li key={h} className="flex items-start gap-2 text-[13px] text-ink-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-3" aria-hidden />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onDone}
        className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-2"
      >
        Siguiente fase: Lectura
      </button>
    </div>
  );
}
