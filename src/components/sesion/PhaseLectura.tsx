"use client";

import { Lightbulb } from "lucide-react";
import type { TextoLectura } from "@/lib/anthropic/sesion";
import FavoritoButton from "@/components/shared/FavoritoButton";
import Mnemotecnia from "./Mnemotecnia";

interface Props {
  textos: TextoLectura[];
  bloque: string;
  onDone: () => void;
}

export default function PhaseLectura({ textos, bloque, onDone }: Props) {
  return (
    <div>
      <h2 className="mb-5 font-display text-lg font-semibold text-ink">Lectura guiada</h2>
      <div className="flex flex-col gap-5">
        {textos.map((t) => (
          <article key={t.titulo} className="rounded-lg border border-border bg-surface-2 p-5">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="font-display text-base font-semibold text-ink">{t.titulo}</h3>
              <FavoritoButton
                tipo="texto"
                titulo={t.titulo}
                contenido={{ titulo: t.titulo, cuerpo: t.cuerpo, idea_clave: t.idea_clave, mnemotecnia: t.mnemotecnia }}
                bloque={bloque}
              />
            </div>
            <p className="mb-4 text-sm leading-relaxed text-ink-2">{t.cuerpo}</p>
            <div className="mb-3 flex items-start gap-2 rounded-lg bg-accent-dim p-3">
              <Lightbulb size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              <p className="text-[13px] font-medium text-accent">{t.idea_clave}</p>
            </div>
            <Mnemotecnia texto={t.mnemotecnia} />
          </article>
        ))}
      </div>
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
