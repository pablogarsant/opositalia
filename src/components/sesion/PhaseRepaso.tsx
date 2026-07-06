"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Flashcard } from "@/lib/anthropic/sesion";

interface Props {
  flashcards: Flashcard[];
  onDone: () => void;
}

const DIFICULTAD = { 1: "Básica", 2: "Media", 3: "Avanzada" } as const;

export default function PhaseRepaso({ flashcards, onDone }: Props) {
  const [indice, setIndice] = useState(0);
  const [volteada, setVolteada] = useState(false);
  const carta = flashcards[indice];
  const ultima = indice === flashcards.length - 1;

  if (!carta) return <p className="text-ink-2">Sin flashcards para este tema.</p>;

  const pasar = (delta: number) => {
    setVolteada(false);
    setIndice((i) => Math.min(Math.max(i + delta, 0), flashcards.length - 1));
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex w-full items-center justify-between text-xs text-ink-3">
        <span>
          Tarjeta {indice + 1} de {flashcards.length}
        </span>
        <span className="rounded-full bg-surface-2 px-2.5 py-0.5">
          {DIFICULTAD[carta.dificultad] ?? "Media"}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setVolteada((v) => !v)}
        aria-label={volteada ? "Ver pregunta" : "Ver respuesta"}
        className={`flex min-h-52 w-full max-w-xl flex-col items-center justify-center rounded-xl border p-8 text-center transition-colors ${
          volteada ? "border-accent bg-accent-dim" : "border-border-2 bg-surface-2"
        }`}
      >
        <span className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
          {volteada ? "Respuesta" : "Pregunta"}
        </span>
        <span className={`text-base font-medium ${volteada ? "text-accent" : "text-ink"}`}>
          {volteada ? carta.respuesta : carta.pregunta}
        </span>
        <span className="mt-4 text-xs text-ink-3">toca para {volteada ? "volver" : "voltear"}</span>
      </button>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => pasar(-1)}
          disabled={indice === 0}
          aria-label="Tarjeta anterior"
          className="rounded-lg border border-border p-2 text-ink-2 hover:border-border-2 disabled:opacity-40"
        >
          <ArrowLeft size={18} aria-hidden />
        </button>
        {ultima ? (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-2"
          >
            Siguiente fase: Conceptos
          </button>
        ) : (
          <button
            type="button"
            onClick={() => pasar(1)}
            aria-label="Siguiente tarjeta"
            className="rounded-lg border border-border p-2 text-ink-2 hover:border-border-2"
          >
            <ArrowRight size={18} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
