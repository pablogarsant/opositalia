"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ChevronDown, Palette } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { actualizarTema } from "@/app/actions/actualizar-tema";
import {
  TEMAS,
  TEMA_LABELS,
  TEMA_SWATCHES,
  TEMA_STORAGE_KEY,
  esTema,
  type Tema,
} from "@/lib/temas";

interface Props {
  /** Tema guardado en el perfil (Supabase) — se aplica si el dispositivo no tiene preferencia local. */
  temaInicial?: string | null;
}

export default function PaletteSelector({ temaInicial }: Props) {
  const { tema, setTema, hydrateTema } = useUIStore();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Sincroniza el store con lo aplicado por el script anti-FOUC.
  // Si el dispositivo no tiene preferencia local, restaura la del perfil.
  useEffect(() => {
    let local: string | null = null;
    try {
      local = localStorage.getItem(TEMA_STORAGE_KEY);
    } catch {
      // sin localStorage seguimos con el tema del DOM
    }
    const aplicado = document.documentElement.dataset.theme;
    if (!esTema(local) && esTema(temaInicial) && temaInicial !== aplicado) {
      setTema(temaInicial);
    } else if (esTema(aplicado)) {
      hydrateTema(aplicado);
    }
  }, [temaInicial, setTema, hydrateTema]);

  // Cierre por click fuera y Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const elegir = (t: Tema) => {
    setTema(t);
    setOpen(false);
    startTransition(() => actualizarTema(t));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Cambiar paleta de color"
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-border-2 hover:text-ink"
      >
        <Palette size={16} className="text-accent" aria-hidden />
        <span className="hidden sm:inline">{TEMA_LABELS[tema]}</span>
        <ChevronDown size={14} aria-hidden />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Paletas de color"
          className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-border bg-surface p-1.5 shadow-lg"
        >
          {TEMAS.map((t) => (
            <li key={t} role="option" aria-selected={t === tema}>
              <button
                type="button"
                onClick={() => elegir(t)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  t === tema
                    ? "bg-accent-dim font-medium text-accent"
                    : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full border border-border-2"
                  style={{ backgroundColor: TEMA_SWATCHES[t] }}
                  aria-hidden
                />
                {TEMA_LABELS[t]}
                {t === tema && <Check size={14} className="ml-auto" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
