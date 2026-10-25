"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crosshair, Play, BookOpen, Search, X } from "lucide-react";
import type { RelacionTema, TemarioArbol } from "@/lib/temario";
import { useUIStore } from "@/stores/uiStore";

/** Lo que usamos de la instancia del grafo (la librería expone bastante más). */
interface GrafoHandle {
  zoomToFit: (ms?: number, px?: number) => void;
  centerAt: (x: number, y: number, ms?: number) => void;
  zoom: (k: number, ms?: number) => void;
}

// El canvas no se renderiza en servidor. El import dinámico pierde los
// genéricos de la librería, así que los accessors se tipan aquí.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse bg-surface-2" />,
}) as unknown as React.ComponentType<
  Record<string, unknown> & { ref?: React.RefObject<GrafoHandle | null> }
>;

interface Nodo {
  id: string;
  nombre: string;
  tipo: "bloque" | "tema" | "subtema";
  puntos: number;
  dominio: number;
  parte: "comun" | "especifica";
  temaId?: string;
  numero?: number | null;
  subtemas?: { id: string; titulo: string; puntos: number }[];
  // las inyecta la simulación
  x?: number;
  y?: number;
}

interface Enlace {
  source: string | Nodo;
  target: string | Nodo;
  tipo: "jerarquico" | "tematico";
  motivo?: string | null;
  peso?: number;
}

type FiltroParte = "todos" | "comun" | "especifica";
type FiltroDominio = "todos" | "pendientes" | "progreso" | "dominados";

const DOMINADO = 75;

function colorDominio(dominio: number, vars: Record<string, string>): string {
  if (dominio >= DOMINADO) return vars.ok;
  if (dominio > 0) return vars.warn;
  return vars.ink3;
}

/** Lee la paleta activa del DOM: el grafo pinta en canvas, no hereda CSS. */
function leerPaleta(): Record<string, string> {
  if (typeof window === "undefined") return { accent: "#2b5ba8", ok: "#15803d", warn: "#b45309", ink: "#1a2333", ink3: "#74829e", border: "#dce6f7", surface: "#ffffff" };
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string, def: string) => cs.getPropertyValue(n).trim() || def;
  return {
    accent: v("--accent", "#2b5ba8"),
    ok: v("--ok", "#15803d"),
    warn: v("--warn", "#b45309"),
    ink: v("--ink", "#1a2333"),
    ink3: v("--ink-3", "#74829e"),
    border: v("--border", "#dce6f7"),
    surface: v("--surface", "#ffffff"),
  };
}

export default function TemarioGrafo({
  arbol,
  relaciones,
  temaInicial,
}: {
  arbol: TemarioArbol;
  relaciones: RelacionTema[];
  temaInicial?: string;
}) {
  const router = useRouter();
  const tema = useUIStore((s) => s.tema);
  // la paleta se lee del DOM; setTema ya ha puesto data-theme antes de este render.
  // `tema` no se usa dentro: es justo la señal de que hay que releerla.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const paleta = useMemo(() => leerPaleta(), [tema]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroParte, setFiltroParte] = useState<FiltroParte>("todos");
  const [filtroDominio, setFiltroDominio] = useState<FiltroDominio>("todos");
  const [verTematicos, setVerTematicos] = useState(true);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [seleccion, setSeleccion] = useState<Nodo | null>(null);
  const [hover, setHover] = useState<Nodo | null>(null);
  const [tam, setTam] = useState({ w: 800, h: 560 });
  const [movil, setMovil] = useState(false);

  const cajaRef = useRef<HTMLDivElement>(null);
  const grafoRef = useRef<GrafoHandle | null>(null);

  useEffect(() => {
    const caja = cajaRef.current;
    if (!caja) return;
    const medir = () => {
      const w = caja.clientWidth;
      setTam({ w, h: Math.max(420, Math.min(680, window.innerHeight - 260)) });
      setMovil(w < 640);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(caja);
    return () => ro.disconnect();
  }, []);

  // ── nodos maestros (referencias estables: la simulación guarda x/y en ellos) ──
  const { nodos, enlaces } = useMemo(() => {
    const nodos = new Map<string, Nodo>();
    const enlaces: Enlace[] = [];

    for (const b of arbol.bloques) {
      const parte: "comun" | "especifica" = b.titulo.toLowerCase().includes("común")
        ? "comun"
        : "especifica";
      const puntosBloque = b.temas.reduce(
        (a, t) => a + t.subtemas.reduce((x, s) => x + s.puntos.length, 0),
        0
      );
      nodos.set(b.id, {
        id: b.id,
        nombre: b.titulo,
        tipo: "bloque",
        puntos: puntosBloque,
        dominio: b.temas.length
          ? Math.round(b.temas.reduce((a, t) => a + t.progreso_dominio, 0) / b.temas.length)
          : 0,
        parte,
      });

      for (const t of b.temas) {
        const puntosTema = t.subtemas.reduce((x, s) => x + s.puntos.length, 0);
        nodos.set(t.id, {
          id: t.id,
          nombre: t.numero ? `${t.numero}. ${t.titulo}` : t.titulo,
          tipo: "tema",
          puntos: puntosTema,
          dominio: t.progreso_dominio,
          parte,
          numero: t.numero,
          subtemas: t.subtemas.map((s) => ({ id: s.id, titulo: s.titulo, puntos: s.puntos.length })),
        });
        enlaces.push({ source: b.id, target: t.id, tipo: "jerarquico" });

        for (const s of t.subtemas) {
          nodos.set(s.id, {
            id: s.id,
            nombre: s.titulo,
            tipo: "subtema",
            puntos: s.puntos.length,
            dominio: s.puntos.length
              ? Math.round(s.puntos.reduce((a, p) => a + p.dominio, 0) / s.puntos.length)
              : 0,
            parte,
            temaId: t.id,
          });
          enlaces.push({ source: t.id, target: s.id, tipo: "jerarquico" });
        }
      }
    }

    for (const r of relaciones) {
      if (!nodos.has(r.tema_a_id) || !nodos.has(r.tema_b_id)) continue;
      enlaces.push({
        source: r.tema_a_id,
        target: r.tema_b_id,
        tipo: "tematico",
        motivo: r.motivo,
        peso: r.peso,
      });
    }
    return { nodos, enlaces };
  }, [arbol.bloques, relaciones]);

  // ── datos visibles según filtros ──
  const datos = useMemo(() => {
    const visibles = new Set<string>();
    for (const n of nodos.values()) {
      if (n.tipo === "subtema") {
        // rendimiento: los subtemas solo aparecen al expandir su tema
        if (!n.temaId || !expandidos.has(n.temaId)) continue;
      }
      if (filtroParte !== "todos" && n.parte !== filtroParte) continue;
      if (n.tipo !== "bloque") {
        if (filtroDominio === "pendientes" && n.dominio !== 0) continue;
        if (filtroDominio === "progreso" && (n.dominio === 0 || n.dominio >= DOMINADO)) continue;
        if (filtroDominio === "dominados" && n.dominio < DOMINADO) continue;
      }
      visibles.add(n.id);
    }
    const idDe = (x: string | Nodo) => (typeof x === "string" ? x : x.id);
    return {
      nodes: [...visibles].map((id) => nodos.get(id)!),
      links: enlaces.filter(
        (l) =>
          (verTematicos || l.tipo !== "tematico") &&
          visibles.has(idDe(l.source)) &&
          visibles.has(idDe(l.target))
      ),
    };
  }, [nodos, enlaces, expandidos, filtroParte, filtroDominio, verTematicos]);

  const q = busqueda.trim().toLowerCase();
  const coincide = useCallback((n: Nodo) => !q || n.nombre.toLowerCase().includes(q), [q]);

  const radio = (n: Nodo) =>
    n.tipo === "bloque" ? 14 : n.tipo === "tema" ? 4 + Math.min(9, n.puntos * 0.8) : 3;

  // ── dibujo del nodo (más barato que el render por defecto con etiquetas) ──
  const dibujarNodo = useCallback(
    (nodo: Nodo, ctx: CanvasRenderingContext2D, escala: number) => {
      const r = radio(nodo);
      const apagado = q.length > 0 && !coincide(nodo);
      ctx.globalAlpha = apagado ? 0.15 : 1;

      ctx.beginPath();
      ctx.arc(nodo.x ?? 0, nodo.y ?? 0, r, 0, 2 * Math.PI);
      ctx.fillStyle =
        nodo.tipo === "bloque" ? paleta.accent : colorDominio(nodo.dominio, paleta);
      ctx.fill();
      if (seleccion?.id === nodo.id || (q && coincide(nodo))) {
        ctx.lineWidth = 2 / escala;
        ctx.strokeStyle = paleta.accent;
        ctx.stroke();
      }

      // etiquetas solo cuando hay zoom suficiente (o siempre para los bloques)
      const mostrarTexto = nodo.tipo === "bloque" || escala > 1.6 || (q.length > 0 && coincide(nodo));
      if (mostrarTexto) {
        const tamTexto = Math.max(3, (nodo.tipo === "bloque" ? 13 : 10) / escala);
        ctx.font = `${tamTexto}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = paleta.ink;
        const etiqueta = nodo.nombre.length > 38 ? `${nodo.nombre.slice(0, 36)}…` : nodo.nombre;
        ctx.fillText(etiqueta, nodo.x ?? 0, (nodo.y ?? 0) + r + 2 / escala);
      }
      ctx.globalAlpha = 1;
    },
    [paleta, q, coincide, seleccion]
  );

  const centrar = () => grafoRef.current?.zoomToFit(400, 60);

  // al llegar desde "temas relacionados", centra en ese tema
  useEffect(() => {
    if (!temaInicial) return;
    const n = nodos.get(temaInicial);
    if (!n) return;
    // espera a que las físicas coloquen el nodo antes de centrarse en él
    const t = setTimeout(() => {
      setSeleccion(n);
      if (n.x !== undefined && n.y !== undefined) grafoRef.current?.centerAt(n.x, n.y, 600);
      grafoRef.current?.zoom(2.5, 600);
    }, 1200);
    return () => clearTimeout(t);
  }, [temaInicial, nodos]);

  const relacionados = useMemo(() => {
    if (!seleccion || seleccion.tipo !== "tema") return [];
    return relaciones
      .filter((r) => r.tema_a_id === seleccion.id || r.tema_b_id === seleccion.id)
      .map((r) => ({
        nodo: nodos.get(r.tema_a_id === seleccion.id ? r.tema_b_id : r.tema_a_id),
        motivo: r.motivo,
      }))
      .filter((x): x is { nodo: Nodo; motivo: string | null } => Boolean(x.nodo))
      .sort((a, b) => (a.nodo.numero ?? 0) - (b.nodo.numero ?? 0));
  }, [seleccion, relaciones, nodos]);

  const estudiar = (n: Nodo) => {
    const parte = n.parte === "comun" ? "Parte Común" : "Parte Específica";
    const titulo = n.nombre.replace(/^\d+\.\s*/, "");
    router.push(`/sesion?tema=${encodeURIComponent(titulo)}&bloque=${encodeURIComponent(parte)}`);
  };

  return (
    <div className="relative">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search size={15} className="absolute left-3 top-2.5 text-ink-3" aria-hidden />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar un tema en el grafo…"
            aria-label="Buscar en el grafo"
            className="w-full rounded-lg border border-border bg-surface px-9 py-2 text-sm text-ink outline-none placeholder:text-ink-3 focus:border-accent"
          />
        </div>
        <p className="text-xs text-ink-3">
          {datos.nodes.length} nodos · {datos.links.length} enlaces
        </p>
      </div>

      <div
        ref={cajaRef}
        className="relative overflow-hidden rounded-xl border border-border bg-surface"
      >
        {/* controles */}
        <div className="absolute right-3 top-3 z-10 flex w-40 flex-col gap-2 rounded-lg border border-border bg-surface/95 p-2 text-[11px] shadow-lg backdrop-blur">
          <div className="flex flex-wrap gap-1">
            {([
              ["todos", "Todos"],
              ["comun", "Común"],
              ["especifica", "Específica"],
            ] as [FiltroParte, string][]).map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setFiltroParte(v)}
                className={`rounded px-1.5 py-1 font-medium ${
                  filtroParte === v ? "bg-accent-dim text-accent" : "text-ink-2 hover:text-ink"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 border-t border-border pt-2">
            {([
              ["todos", "Todos"],
              ["pendientes", "Pendientes"],
              ["progreso", "En progreso"],
              ["dominados", "Dominados"],
            ] as [FiltroDominio, string][]).map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setFiltroDominio(v)}
                className={`rounded px-1.5 py-1 font-medium ${
                  filtroDominio === v ? "bg-accent-dim text-accent" : "text-ink-2 hover:text-ink"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 border-t border-border pt-2 text-ink-2">
            <input
              type="checkbox"
              checked={verTematicos}
              onChange={(e) => setVerTematicos(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            Enlaces temáticos
          </label>
          <button
            type="button"
            onClick={centrar}
            className="flex items-center gap-1.5 rounded border border-border px-2 py-1 font-medium text-ink-2 hover:border-border-2"
          >
            <Crosshair size={12} aria-hidden /> Centrar
          </button>
        </div>

        {/* leyenda */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1 rounded-lg border border-border bg-surface/95 p-2 text-[11px] text-ink-2 shadow-lg backdrop-blur">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ink-3" /> Sin empezar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-warn" /> En progreso
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ok" /> Dominado
          </span>
        </div>

        {hover && (
          <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-64 rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg">
            <p className="font-semibold text-ink">{hover.nombre}</p>
            <p className="mt-0.5 text-ink-3">
              {hover.puntos} puntos · {hover.dominio}% de dominio
            </p>
          </div>
        )}

        <ForceGraph2D
          ref={grafoRef}
          width={tam.w}
          height={tam.h}
          graphData={datos}
          backgroundColor="transparent"
          nodeRelSize={1}
          nodeCanvasObject={dibujarNodo}
          nodePointerAreaPaint={(nodo: Nodo, color: string, ctx: CanvasRenderingContext2D) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(nodo.x ?? 0, nodo.y ?? 0, radio(nodo) + 2, 0, 2 * Math.PI);
            ctx.fill();
          }}
          linkColor={(l: Enlace) => (l.tipo === "tematico" ? paleta.accent : paleta.border)}
          linkWidth={(l: Enlace) => (l.tipo === "tematico" ? 1 : 0.6)}
          linkLineDash={(l: Enlace) => (l.tipo === "tematico" ? [3, 3] : null)}
          onNodeHover={(n: Nodo | null) => setHover(n)}
          onNodeClick={(n: Nodo) => setSeleccion(n)}
          onNodeDragEnd={(n: Nodo & { fx?: number; fy?: number }) => {
            // al soltar, el nodo se queda donde lo dejaron
            n.fx = n.x;
            n.fy = n.y;
          }}
          onBackgroundClick={() => setSeleccion(null)}
          onNodeDoubleClick={(n: Nodo) =>
            n.tipo === "tema" &&
            setExpandidos((prev) => {
              const s = new Set(prev);
              if (s.has(n.id)) s.delete(n.id);
              else s.add(n.id);
              return s;
            })
          }
          // físicas: se enfrían y paran (en móvil, antes)
          cooldownTicks={movil ? 60 : 140}
          warmupTicks={movil ? 20 : 0}
          d3AlphaDecay={movil ? 0.06 : 0.0228}
          onEngineStop={() => grafoRef.current?.zoomToFit(400, 60)}
          enableNodeDrag={!movil}
        />
      </div>

      <p className="mt-2 text-[11px] text-ink-3">
        Rueda para zoom · arrastra para mover · clic para abrir el panel · doble clic en un tema
        para desplegar sus subtemas.
      </p>

      {/* panel lateral del nodo */}
      {seleccion && (
        <aside
          className="fixed right-0 top-0 z-40 flex h-dvh w-80 max-w-[85vw] flex-col overflow-y-auto border-l border-border bg-surface p-5 shadow-2xl"
          aria-label={`Detalle de ${seleccion.nombre}`}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              {seleccion.numero != null && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
                  Tema {seleccion.numero} · BOJA
                </p>
              )}
              <h2 className="font-display text-lg leading-tight font-semibold text-ink">
                {seleccion.nombre.replace(/^\d+\.\s*/, "")}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setSeleccion(null)}
              aria-label="Cerrar panel"
              className="rounded-lg p-1 text-ink-3 hover:bg-surface-2"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          <div className="mb-4">
            <div className="mb-1 flex justify-between text-xs text-ink-2">
              <span>Dominio</span>
              <span>{seleccion.dominio}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${seleccion.dominio}%`,
                  background: colorDominio(seleccion.dominio, paleta),
                }}
              />
            </div>
            <p className="mt-1 text-[11px] text-ink-3">{seleccion.puntos} puntos específicos</p>
          </div>

          {seleccion.tipo !== "bloque" && (
            <div className="mb-4 flex flex-col gap-2">
              <Link
                href={`/temario/${seleccion.tipo === "subtema" ? seleccion.temaId : seleccion.id}${
                  seleccion.tipo === "subtema" ? `?subtema=${seleccion.id}` : ""
                }`}
                className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg hover:bg-accent-2"
              >
                <BookOpen size={15} aria-hidden /> Ver temario
              </Link>
              <button
                type="button"
                onClick={() => estudiar(seleccion)}
                className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-ink-2 hover:border-border-2"
              >
                <Play size={15} aria-hidden /> Sesión de repaso
              </button>
            </div>
          )}

          {seleccion.subtemas && seleccion.subtemas.length > 0 && (
            <div className="mb-4">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                Subtemas
              </p>
              <ul className="flex flex-col gap-1">
                {seleccion.subtemas.map((s) => (
                  <li key={s.id} className="flex justify-between gap-2 text-[13px] text-ink-2">
                    <span>{s.titulo}</span>
                    <span className="shrink-0 text-ink-3">{s.puntos}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {relacionados.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                Temas relacionados
              </p>
              <ul className="flex flex-col gap-1.5">
                {relacionados.map(({ nodo, motivo }) => (
                  <li key={nodo.id}>
                    <button
                      type="button"
                      onClick={() => setSeleccion(nodo)}
                      className="block w-full rounded-lg border border-border px-3 py-2 text-left hover:border-accent"
                    >
                      <span className="block text-[13px] text-ink">{nodo.nombre}</span>
                      {motivo && <span className="block text-[11px] text-ink-3">{motivo}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
