"use client";

import type { ReactNode } from "react";

interface Props {
  conceptos: string[];
  onDone: () => void;
}

export default function PhaseConceptos({ conceptos, onDone }: Props): ReactNode {
  return (
    <div>
      <h2 className="mb-5 font-display text-lg font-semibold text-ink">
        Las ideas que tienes que retener
      </h2>
      <ol className="flex flex-col gap-3">
        {conceptos.map((c, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-lg border border-border bg-surface-2 p-4"
          >
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-dim text-xs font-bold text-accent"
              aria-hidden
            >
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-ink">{c}</p>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={onDone}
        className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-2"
      >
        Siguiente fase: Mapa mental
      </button>
    </div>
  );
}
