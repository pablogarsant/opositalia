"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { NotaRow } from "@/types/database";

export default function NotasLista() {
  const [notas, setNotas] = useState<NotaRow[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nueva, setNueva] = useState<string | null>(null);
  const [editando, setEditando] = useState<{ id: string; texto: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
     
    void fetch("/api/notas")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || json.error) throw new Error(json.error ?? `HTTP ${r.status}`);
        setNotas(json.data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setCargando(false));
  }, []);

  const guardarNueva = async () => {
    const contenido = nueva?.trim();
    if (!contenido) return;
    const res = await fetch("/api/notas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenido }),
    });
    const json = await res.json();
    if (json.data) {
      setNotas((prev) => [json.data, ...prev]);
      setNueva(null);
    } else {
      setError(json.error ?? "No se pudo guardar");
    }
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    const res = await fetch(`/api/notas/${editando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenido: editando.texto.trim() }),
    });
    const json = await res.json();
    if (json.data) {
      setNotas((prev) => prev.map((n) => (n.id === editando.id ? json.data : n)));
      setEditando(null);
    } else {
      setError(json.error ?? "No se pudo actualizar");
    }
  };

  const borrar = async (id: string) => {
    if (!confirm("¿Borrar esta nota?")) return;
    const res = await fetch(`/api/notas/${id}`, { method: "DELETE" });
    if (res.ok) setNotas((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="rounded-lg bg-danger-dim px-4 py-2 text-sm text-danger">{error}</p>}

      {nueva === null ? (
        <button
          type="button"
          onClick={() => setNueva("")}
          className="flex items-center gap-2 self-start rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-2"
        >
          <Plus size={16} aria-hidden /> Nueva nota
        </button>
      ) : (
        <div className="rounded-xl border border-accent bg-surface p-4">
          <textarea
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            autoFocus
            rows={5}
            placeholder="Escribe lo que quieras recordar…"
            className="w-full resize-y rounded-lg border border-border bg-surface-2 p-3 font-display text-[15px] leading-relaxed text-ink outline-none focus:border-accent"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void guardarNueva()}
              disabled={!nueva.trim()}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-2 disabled:opacity-50"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setNueva(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-ink-2 hover:border-border-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {cargando && <p className="text-sm text-ink-3">Cargando notas…</p>}
      {!cargando && notas.length === 0 && (
        <p className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-ink-2">
          Sin notas todavía. La primera idea que no quieras perder, apúntala aquí.
        </p>
      )}

      {notas.map((nota) => (
        <article key={nota.id} className="rounded-xl border border-border bg-surface p-5">
          {editando?.id === nota.id ? (
            <>
              <textarea
                value={editando.texto}
                onChange={(e) => setEditando({ id: nota.id, texto: e.target.value })}
                rows={5}
                className="w-full resize-y rounded-lg border border-border bg-surface-2 p-3 font-display text-[15px] leading-relaxed text-ink outline-none focus:border-accent"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void guardarEdicion()}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-2"
                >
                  Guardar cambios
                </button>
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-ink-2"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="whitespace-pre-wrap font-display text-[15px] leading-relaxed text-ink">
                {nota.contenido}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <time className="text-xs text-ink-3">
                  {new Date(nota.created_at).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setEditando({ id: nota.id, texto: nota.contenido })}
                    aria-label="Editar nota"
                    className="rounded p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
                  >
                    <Pencil size={15} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => void borrar(nota.id)}
                    aria-label="Borrar nota"
                    className="rounded p-1.5 text-ink-3 hover:bg-danger-dim hover:text-danger"
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              </div>
            </>
          )}
        </article>
      ))}
    </div>
  );
}
