"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  CircleDot,
  Play,
  Search,
  X,
} from "lucide-react";
import type { BloqueArbol, PuntoArbol, TemarioArbol } from "@/lib/temario";

type Filtro = "todos" | "pendientes" | "comun" | "especifica";

function IconoDominio({ dominio, completado }: { dominio: number; completado: boolean }) {
  if (completado) return <CircleCheck size={14} className="shrink-0 text-ok" aria-label="Completado" />;
  if (dominio > 0) return <CircleDot size={14} className="shrink-0 text-warn" aria-label="En progreso" />;
  return <CircleDashed size={14} className="shrink-0 text-ink-3" aria-label="Sin empezar" />;
}

export default function TemarioArbolVista({ arbol }: { arbol: TemarioArbol }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const [punto, setPunto] = useState<{ punto: PuntoArbol; bloque: string } | null>(null);

  const toggle = (id: string) =>
    setAbiertos((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });

  const q = busqueda.trim().toLowerCase();

  // filtra el árbol; si hay búsqueda, autoexpande lo que coincide
  const { bloques, autoAbiertos } = useMemo(() => {
    const auto = new Set<string>();
    const bloquesF: BloqueArbol[] = arbol.bloques
      .map((b) => {
        const parte = b.titulo.toLowerCase().includes("común") ? "comun" : "especifica";
        if (filtro === "comun" && parte !== "comun") return null;
        if (filtro === "especifica" && parte !== "especifica") return null;
        const temas = b.temas
          .map((t) => {
            const subtemas = t.subtemas
              .map((s) => {
                const puntos = s.puntos.filter((p) => {
                  if (filtro === "pendientes" && p.completado) return false;
                  if (!q) return true;
                  const hit =
                    p.titulo.toLowerCase().includes(q) ||
                    s.titulo.toLowerCase().includes(q) ||
                    t.titulo.toLowerCase().includes(q);
                  if (hit) {
                    auto.add(b.id);
                    auto.add(t.id);
                    auto.add(s.id);
                  }
                  return hit;
                });
                return { ...s, puntos };
              })
              .filter((s) => s.puntos.length > 0);
            return { ...t, subtemas };
          })
          .filter((t) => t.subtemas.length > 0);
        return { ...b, temas };
      })
      .filter((b): b is BloqueArbol => b !== null && b.temas.length > 0);
    return { bloques: bloquesF, autoAbiertos: auto };
  }, [arbol.bloques, q, filtro]);

  const esta = (id: string) => abiertos.has(id) || (q.length > 0 && autoAbiertos.has(id));

  const pct = arbol.total_puntos
    ? Math.round((arbol.puntos_completados / arbol.total_puntos) * 100)
    : 0;

  const estudiar = (p: PuntoArbol, bloque: string) => {
    const parte = bloque.toLowerCase().includes("común") ? "Parte Común" : "Parte Específica";
    router.push(`/sesion?tema=${encodeURIComponent(p.titulo)}&bloque=${encodeURIComponent(parte)}`);
  };

  return (
    <>
      {/* progreso global */}
      <div className="mb-4 rounded-xl border border-border bg-surface p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-ink">Progreso del temario</span>
          <span className="text-ink-2">
            {arbol.puntos_completados}/{arbol.total_puntos} puntos · {pct}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* búsqueda + filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search size={15} className="absolute left-3 top-2.5 text-ink-3" aria-hidden />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar cualquier concepto…"
            aria-label="Buscar en el temario"
            className="w-full rounded-lg border border-border bg-surface px-9 py-2 text-sm text-ink outline-none placeholder:text-ink-3 focus:border-accent"
          />
        </div>
        {([
          ["todos", "Todos"],
          ["pendientes", "Solo pendientes"],
          ["comun", "Parte común"],
          ["especifica", "Parte específica"],
        ] as [Filtro, string][]).map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => setFiltro(val)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              filtro === val
                ? "border-accent bg-accent-dim text-accent"
                : "border-border bg-surface text-ink-2 hover:border-border-2"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* árbol */}
      <div className="flex flex-col gap-2">
        {bloques.length === 0 && <p className="py-8 text-center text-sm text-ink-3">Sin resultados.</p>}
        {bloques.map((b) => (
          <div key={b.id} className="rounded-xl border border-border bg-surface">
            <button
              type="button"
              onClick={() => toggle(b.id)}
              className="flex w-full items-center gap-2 px-4 py-3 text-left"
            >
              {esta(b.id) ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
              <span className="font-display text-base font-semibold text-ink">{b.titulo}</span>
              <span className="ml-auto text-xs text-ink-3">{b.temas.length} temas</span>
            </button>

            {esta(b.id) && (
              <div className="border-t border-border px-2 pb-2">
                {b.temas.map((t) => (
                  <div key={t.id} className="mt-1">
                    <button
                      type="button"
                      onClick={() => toggle(t.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-surface-2"
                    >
                      {esta(t.id) ? (
                        <ChevronDown size={14} className="text-ink-3" aria-hidden />
                      ) : (
                        <ChevronRight size={14} className="text-ink-3" aria-hidden />
                      )}
                      <span className="text-sm font-medium text-ink">{t.titulo}</span>
                      {t.capitulo_kanski && (
                        <span className="hidden rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink-3 sm:inline">
                          {t.capitulo_kanski}
                        </span>
                      )}
                      <span
                        className={`ml-auto text-xs font-semibold ${
                          t.completado ? "text-ok" : t.progreso_dominio > 0 ? "text-warn" : "text-ink-3"
                        }`}
                      >
                        {t.progreso_dominio}%
                      </span>
                    </button>

                    {esta(t.id) && (
                      <div className="ml-5 border-l border-border pl-3">
                        {t.subtemas.map((s) => (
                          <div key={s.id} className="mt-1">
                            <button
                              type="button"
                              onClick={() => toggle(s.id)}
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-surface-2"
                            >
                              {esta(s.id) ? (
                                <ChevronDown size={13} className="text-ink-3" aria-hidden />
                              ) : (
                                <ChevronRight size={13} className="text-ink-3" aria-hidden />
                              )}
                              <span className="text-[13px] text-ink-2">{s.titulo}</span>
                            </button>
                            {esta(s.id) && (
                              <ul className="ml-5 flex flex-col gap-0.5 border-l border-border pl-3">
                                {s.puntos.map((p) => (
                                  <li key={p.id}>
                                    <button
                                      type="button"
                                      onClick={() => setPunto({ punto: p, bloque: b.titulo })}
                                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-ink hover:bg-accent-dim"
                                    >
                                      <IconoDominio dominio={p.dominio} completado={p.completado} />
                                      {p.titulo}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {punto && (
        <PuntoModal
          punto={punto.punto}
          bloque={punto.bloque}
          onClose={() => setPunto(null)}
          onEstudiar={() => estudiar(punto.punto, punto.bloque)}
        />
      )}
    </>
  );
}

function PuntoModal({
  punto,
  bloque,
  onClose,
  onEstudiar,
}: {
  punto: PuntoArbol;
  bloque: string;
  onClose: () => void;
  onEstudiar: () => void;
}) {
  const [fragmentos, setFragmentos] = useState<{ texto: string; fuente: string }[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verContenido = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/temario/contenido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: punto.titulo, bloque }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setFragmentos(json.data.fragmentos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el contenido");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-ink">{punto.titulo}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1 text-ink-3 hover:bg-surface-2">
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEstudiar}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-2"
          >
            <Play size={15} aria-hidden /> Estudiar este punto
          </button>
          <button
            type="button"
            onClick={() => void verContenido()}
            disabled={cargando}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-ink-2 hover:border-border-2 disabled:opacity-50"
          >
            <BookOpen size={15} aria-hidden /> {cargando ? "Buscando…" : "Ver en el temario"}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
        {fragmentos && (
          <div className="mt-5 flex flex-col gap-3">
            {fragmentos.length === 0 && (
              <p className="text-sm text-ink-3">No se encontró contenido específico en el temario para este punto.</p>
            )}
            {fragmentos.map((f, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-2 p-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-accent">{f.fuente}</p>
                <p className="text-[13px] leading-relaxed text-ink-2">{f.texto}…</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
