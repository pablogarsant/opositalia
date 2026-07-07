"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer, Trash2 } from "lucide-react";
import type { FavoritoRow } from "@/types/database";

const TIPO_LABEL: Record<string, string> = {
  flashcard: "Flashcards",
  idea_clave: "Ideas clave",
  mnemotecnia: "Mnemotecnias",
  pregunta: "Preguntas",
  texto: "Textos",
};

function renderContenido(f: FavoritoRow): string {
  const c = f.contenido as Record<string, unknown>;
  switch (f.tipo) {
    case "flashcard":
      return `${c.pregunta}\n→ ${c.respuesta}`;
    case "pregunta":
      return `${c.enunciado}\n✔ ${(c.opciones as string[])?.[c.correcta as number] ?? ""}`;
    case "texto":
      return `${c.idea_clave}\nMnemotecnia: ${c.mnemotecnia}`;
    default:
      return JSON.stringify(c);
  }
}

export default function FavoritosLista() {
  const [favoritos, setFavoritos] = useState<FavoritoRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroBloque, setFiltroBloque] = useState<string>("");

  useEffect(() => {
     
    void fetch("/api/favoritos")
      .then(async (r) => {
        const json = await r.json();
        setFavoritos(json.data ?? []);
      })
      .finally(() => setCargando(false));
  }, []);

  const bloques = useMemo(
    () => [...new Set(favoritos.map((f) => f.bloque).filter(Boolean))] as string[],
    [favoritos]
  );

  const visibles = filtroBloque ? favoritos.filter((f) => f.bloque === filtroBloque) : favoritos;
  const grupos = useMemo(() => {
    const m = new Map<string, FavoritoRow[]>();
    for (const f of visibles) {
      if (!m.has(f.tipo)) m.set(f.tipo, []);
      m.get(f.tipo)!.push(f);
    }
    return m;
  }, [visibles]);

  const borrar = async (id: string) => {
    const res = await fetch(`/api/favoritos/${id}`, { method: "DELETE" });
    if (res.ok) setFavoritos((prev) => prev.filter((f) => f.id !== id));
  };

  if (cargando) return <p className="text-sm text-ink-3">Cargando favoritos…</p>;
  if (!favoritos.length) {
    return (
      <p className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-ink-2">
        Aún no has guardado nada. Durante las sesiones, toca la estrella en cualquier tarjeta.
      </p>
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2 print:hidden">
        <select
          value={filtroBloque}
          onChange={(e) => setFiltroBloque(e.target.value)}
          aria-label="Filtrar por bloque"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        >
          <option value="">Todos los bloques</option>
          {bloques.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-2 hover:border-border-2"
        >
          <Printer size={15} aria-hidden /> Exportar PDF
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {[...grupos.entries()].map(([tipo, lista]) => (
          <section key={tipo}>
            <h2 className="mb-3 text-sm font-semibold text-ink">
              {TIPO_LABEL[tipo] ?? tipo}{" "}
              <span className="font-normal text-ink-3">({lista.length})</span>
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {lista.map((f) => (
                <article key={f.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{f.titulo}</p>
                    <button
                      type="button"
                      onClick={() => void borrar(f.id)}
                      aria-label="Quitar de favoritos"
                      className="rounded p-1 text-ink-3 hover:text-danger print:hidden"
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">
                    {renderContenido(f)}
                  </p>
                  {f.bloque && <p className="mt-2 text-[11px] text-ink-3">{f.bloque}</p>}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
