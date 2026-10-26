"use client";

import { useEffect } from "react";
import { Network, TreePine } from "lucide-react";
import type { RelacionTema, TemarioArbol } from "@/lib/temario";
import { useUIStore } from "@/stores/uiStore";
import TemarioArbolVista from "./TemarioArbol";
import TemarioGrafo from "./TemarioGrafo";

interface Props {
  arbol: TemarioArbol;
  relaciones: RelacionTema[];
  vistaInicial?: "arbol" | "grafo";
  temaInicial?: string;
}

/** Árbol y grafo comparten ruta: solo cambia el componente renderizado. */
export default function TemarioVista({ arbol, relaciones, vistaInicial, temaInicial }: Props) {
  const vista = useUIStore((s) => s.vistaTemario);
  const setVista = useUIStore((s) => s.setVistaTemario);

  // "ver temas relacionados" llega con ?vista=grafo&tema=…
  useEffect(() => {
    if (vistaInicial) setVista(vistaInicial);
  }, [vistaInicial, setVista]);

  return (
    <>
      <div
        className="mb-4 flex w-fit items-center gap-1 rounded-lg border border-border bg-surface p-1"
        role="group"
        aria-label="Vista del temario"
      >
        {([
          ["arbol", "Árbol", TreePine],
          ["grafo", "Grafo", Network],
        ] as const).map(([val, label, Icon]) => (
          <button
            key={val}
            type="button"
            onClick={() => setVista(val)}
            aria-pressed={vista === val}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              vista === val ? "bg-accent-dim text-accent" : "text-ink-2 hover:text-ink"
            }`}
          >
            <Icon size={14} aria-hidden /> {label}
          </button>
        ))}
      </div>

      {vista === "grafo" ? (
        <TemarioGrafo arbol={arbol} relaciones={relaciones} temaInicial={temaInicial} />
      ) : (
        <TemarioArbolVista arbol={arbol} />
      )}
    </>
  );
}
