"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Network,
  NotebookPen,
  Play,
  ScrollText,
  Star,
} from "lucide-react";
import type { TemaLibro } from "@/lib/temario";
import { useUIStore } from "@/stores/uiStore";
import { useChatDetalle } from "@/hooks/useChatDetalle";
import ContenidoPunto from "./ContenidoPunto";

interface Props {
  tema: TemaLibro;
  puntoInicial?: string;
  subtemaInicial?: string;
}

interface Entrada {
  puntoId: string;
  puntoTitulo: string;
  subtemaId: string;
  subtemaTitulo: string;
  keywords: string[];
  dominio: number;
  completado: boolean;
}

export default function VistaLibro({ tema, puntoInicial, subtemaInicial }: Props) {
  const router = useRouter();
  const modo = useUIStore((s) => s.modoLectura);
  const setModo = useUIStore((s) => s.setModoLectura);

  // el temario en plano: el orden de lectura del libro
  const entradas = useMemo<Entrada[]>(
    () =>
      tema.subtemas.flatMap((s) =>
        s.puntos.map((p) => ({
          puntoId: p.id,
          puntoTitulo: p.titulo,
          subtemaId: s.id,
          subtemaTitulo: s.titulo,
          keywords: p.keywords,
          dominio: p.dominio,
          completado: p.completado,
        }))
      ),
    [tema.subtemas]
  );

  const indiceInicial = Math.max(
    0,
    puntoInicial
      ? entradas.findIndex((e) => e.puntoId === puntoInicial)
      : subtemaInicial
        ? entradas.findIndex((e) => e.subtemaId === subtemaInicial)
        : 0
  );

  const [activo, setActivo] = useState(indiceInicial);
  const [progreso, setProgreso] = useState(0);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const secciones = useRef(new Map<string, HTMLElement>());

  const actual = entradas[activo];
  useChatDetalle({
    tema_id: tema.id,
    tema_titulo: tema.numero ? `${tema.numero} — ${tema.titulo}` : tema.titulo,
    punto_id: actual?.puntoId,
    punto_titulo: actual?.puntoTitulo,
    bloque: tema.bloque_titulo,
  });

  // ── scroll spy + barra de progreso (solo en modo scroll) ──
  useEffect(() => {
    if (modo !== "scroll") return;
    const obs = new IntersectionObserver(
      (entradasObs) => {
        const visible = entradasObs
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;
        const id = (visible.target as HTMLElement).dataset.puntoId;
        const i = entradas.findIndex((e) => e.puntoId === id);
        if (i >= 0) setActivo(i);
      },
      // franja alta: marca como activo lo que está en el tercio superior
      { rootMargin: "-10% 0px -70% 0px", threshold: 0 }
    );
    for (const nodo of secciones.current.values()) obs.observe(nodo);

    const onScroll = () => {
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      setProgreso(alto > 0 ? Math.min(100, (window.scrollY / alto) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [modo, entradas]);

  // al entrar con ?punto=…, baja hasta esa sección
  useEffect(() => {
    if (modo !== "scroll" || !puntoInicial) return;
    const nodo = secciones.current.get(puntoInicial);
    nodo?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [modo, puntoInicial]);

  const irA = useCallback(
    (i: number) => {
      const destino = Math.max(0, Math.min(entradas.length - 1, i));
      setActivo(destino);
      if (modo === "scroll") {
        secciones.current.get(entradas[destino].puntoId)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        contenedorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [entradas, modo]
  );

  // ── teclado y swipe (modo páginas) ──
  useEffect(() => {
    if (modo !== "paginas") return;
    const onKey = (e: KeyboardEvent) => {
      const enCampo = (e.target as HTMLElement)?.closest("input, textarea, [contenteditable]");
      if (enCampo) return;
      if (e.key === "ArrowRight") irA(activo + 1);
      if (e.key === "ArrowLeft") irA(activo - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modo, activo, irA]);

  const tactil = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    tactil.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (modo !== "paginas" || !tactil.current) return;
    const dx = e.changedTouches[0].clientX - tactil.current.x;
    const dy = e.changedTouches[0].clientY - tactil.current.y;
    tactil.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) irA(activo + (dx < 0 ? 1 : -1));
  };

  // ── acciones ──
  const estudiar = () => {
    const parte = tema.bloque_titulo.toLowerCase().includes("común")
      ? "Parte Común"
      : "Parte Específica";
    const objetivo = actual?.puntoTitulo ?? tema.titulo;
    router.push(`/sesion?tema=${encodeURIComponent(objetivo)}&bloque=${encodeURIComponent(parte)}`);
  };

  const [guardado, setGuardado] = useState(false);
  const guardarFavorito = async () => {
    if (!actual || guardado) return;
    const res = await fetch("/api/favoritos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "texto",
        titulo: actual.puntoTitulo,
        contenido: { tema: tema.titulo, subtema: actual.subtemaTitulo, punto_id: actual.puntoId },
        bloque: tema.bloque_titulo,
      }),
    }).catch(() => null);
    if (res?.ok) setGuardado(true);
  };

  const [nota, setNota] = useState<string | null>(null);
  const [guardandoNota, setGuardandoNota] = useState(false);
  const guardarNota = async () => {
    if (!nota?.trim() || guardandoNota) return;
    setGuardandoNota(true);
    const res = await fetch("/api/notas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contenido: `**${tema.titulo} · ${actual?.puntoTitulo ?? ""}**\n\n${nota.trim()}`,
      }),
    }).catch(() => null);
    setGuardandoNota(false);
    if (res?.ok) setNota(null);
  };

  if (entradas.length === 0) {
    return (
      <div className="rounded-xl border border-warn/40 bg-warn-dim p-6">
        <p className="font-medium text-ink">Este tema aún no tiene puntos cargados.</p>
        <Link href="/temario" className="mt-3 inline-block text-sm text-accent underline">
          Volver al temario
        </Link>
      </div>
    );
  }

  const visibles = modo === "scroll" ? entradas : [entradas[activo]];

  return (
    <>
      {/* barra de progreso de lectura */}
      {modo === "scroll" && (
        <div
          className="fixed inset-x-0 top-0 z-30 h-0.5 bg-transparent"
          role="progressbar"
          aria-label="Progreso de lectura"
          aria-valuenow={Math.round(progreso)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full bg-accent transition-[width]" style={{ width: `${progreso}%` }} />
        </div>
      )}

      {/* cabecera */}
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/temario"
            className="mb-1.5 inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-accent"
          >
            <ArrowLeft size={14} aria-hidden /> Volver al temario
          </Link>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {tema.numero ? `Tema ${tema.numero} — ` : ""}
            {tema.titulo}
          </h1>
          <p className="mt-1 text-xs text-ink-3">
            {tema.bloque_titulo}
            {tema.capitulo_kanski ? ` · ${tema.capitulo_kanski}` : ""} · {entradas.length} puntos ·{" "}
            {tema.progreso_dominio}% de dominio
          </p>
        </div>

        <div
          className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1"
          role="group"
          aria-label="Modo de lectura"
        >
          {([
            ["scroll", "Scroll", ScrollText],
            ["paginas", "Páginas", FileText],
          ] as const).map(([val, label, Icon]) => (
            <button
              key={val}
              type="button"
              onClick={() => setModo(val)}
              aria-pressed={modo === val}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                modo === val ? "bg-accent-dim text-accent" : "text-ink-2 hover:text-ink"
              }`}
            >
              <Icon size={14} aria-hidden /> {label}
            </button>
          ))}
        </div>
      </header>

      {/* índice plegable en móvil: el lateral solo existe en lg+ */}
      <details className="mb-4 rounded-xl border border-border bg-surface lg:hidden">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink">
          Índice del tema ({entradas.length} puntos)
        </summary>
        <ul className="border-t border-border px-4 py-2">
          {entradas.map((e, i) => (
            <li key={e.puntoId}>
              <button
                type="button"
                onClick={() => irA(i)}
                className={`block w-full py-1.5 text-left text-[13px] ${
                  i === activo ? "font-medium text-accent" : "text-ink-2"
                }`}
              >
                {e.puntoTitulo}
              </button>
            </li>
          ))}
        </ul>
      </details>

      <div className="flex gap-8">
        {/* índice lateral */}
        <nav
          aria-label="Índice del tema"
          className="sticky top-6 hidden h-[calc(100dvh-6rem)] w-60 shrink-0 flex-col overflow-y-auto lg:flex"
        >
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
            Índice
          </p>
          <ul className="flex flex-col gap-3">
            {tema.subtemas.map((s) => (
              <li key={s.id}>
                <p className="mb-1 text-[13px] font-semibold text-ink">{s.titulo}</p>
                <ul className="flex flex-col border-l border-border">
                  {s.puntos.map((p) => {
                    const i = entradas.findIndex((e) => e.puntoId === p.id);
                    const esActivo = i === activo;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => irA(i)}
                          aria-current={esActivo ? "location" : undefined}
                          className={`-ml-px block w-full border-l-2 py-1 pl-3 text-left text-[12px] leading-snug transition-colors ${
                            esActivo
                              ? "border-accent font-medium text-accent"
                              : "border-transparent text-ink-2 hover:text-ink"
                          }`}
                        >
                          {p.titulo}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col gap-1.5 border-t border-border pt-4">
            <button
              type="button"
              onClick={estudiar}
              className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-[13px] font-medium text-accent-fg hover:bg-accent-2"
            >
              <Play size={14} aria-hidden /> Estudiar este tema
            </button>
            <button
              type="button"
              onClick={() => void guardarFavorito()}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[13px] text-ink-2 hover:border-border-2"
            >
              <Star size={14} fill={guardado ? "currentColor" : "none"} aria-hidden />
              {guardado ? "Guardado" : "Favorito"}
            </button>
            <button
              type="button"
              onClick={() => setNota((n) => (n === null ? "" : null))}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[13px] text-ink-2 hover:border-border-2"
            >
              <NotebookPen size={14} aria-hidden /> Añadir nota
            </button>
            <Link
              href={`/temario?vista=grafo&tema=${tema.id}`}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[13px] text-ink-2 hover:border-border-2"
            >
              <Network size={14} aria-hidden /> Temas relacionados
            </Link>
          </div>
        </nav>

        {/* contenido */}
        <div
          ref={contenedorRef}
          className="min-w-0 flex-1"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className={modo === "paginas" ? "pagina-in" : undefined} key={modo === "paginas" ? activo : "scroll"}>
            {visibles.map((e, i) => {
              const primeroDelSubtema =
                modo === "paginas" || i === 0 || visibles[i - 1].subtemaId !== e.subtemaId;
              return (
                <section
                  key={e.puntoId}
                  data-punto-id={e.puntoId}
                  ref={(nodo) => {
                    if (nodo) secciones.current.set(e.puntoId, nodo);
                    else secciones.current.delete(e.puntoId);
                  }}
                  className="scroll-mt-20"
                >
                  {primeroDelSubtema && (
                    <h2 className="font-display mt-2 mb-5 border-b border-border pb-3 text-[26px] leading-tight font-semibold text-ink">
                      {e.subtemaTitulo}
                    </h2>
                  )}
                  <h3 className="font-display mt-8 mb-3 text-xl font-semibold text-ink">
                    {e.puntoTitulo}
                  </h3>
                  <article className="prosa-libro">
                    <ContenidoPunto
                      punto={{
                        id: e.puntoId,
                        titulo: e.puntoTitulo,
                        orden: 0,
                        keywords: e.keywords,
                        dominio: e.dominio,
                        completado: e.completado,
                      }}
                      subtemaId={e.subtemaId}
                      contexto={`${tema.titulo} · ${e.subtemaTitulo}`}
                      bloque={tema.bloque_titulo}
                    />
                  </article>
                </section>
              );
            })}
          </div>

          {/* navegación entre puntos */}
          <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-5">
            <button
              type="button"
              onClick={() => irA(activo - 1)}
              disabled={activo === 0}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[13px] text-ink-2 hover:border-border-2 disabled:opacity-40"
            >
              <ChevronLeft size={15} aria-hidden /> Anterior
            </button>

            <div className="flex items-center gap-1.5" aria-hidden>
              {entradas.length <= 12 ? (
                entradas.map((e, i) => (
                  <span
                    key={e.puntoId}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activo ? "w-4 bg-accent" : "w-1.5 bg-border-2"
                    }`}
                  />
                ))
              ) : (
                <span className="text-xs text-ink-3">
                  {activo + 1} de {entradas.length}
                </span>
              )}
            </div>
            <span className="sr-only">
              Punto {activo + 1} de {entradas.length}
            </span>

            <button
              type="button"
              onClick={() => irA(activo + 1)}
              disabled={activo === entradas.length - 1}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[13px] text-ink-2 hover:border-border-2 disabled:opacity-40"
            >
              Siguiente <ChevronRight size={15} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {/* acciones flotantes: abajo a la izquierda, el chat está a la derecha */}
      <div className="fixed bottom-5 left-4 z-30 flex flex-col gap-2 lg:hidden">
        <button
          type="button"
          onClick={estudiar}
          aria-label="Estudiar este punto"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg"
        >
          <Play size={17} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => void guardarFavorito()}
          aria-label="Guardar en favoritos"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-ink-2 shadow-lg"
        >
          <Star size={17} fill={guardado ? "currentColor" : "none"} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setNota((n) => (n === null ? "" : null))}
          aria-label="Añadir nota sobre este punto"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-ink-2 shadow-lg"
        >
          <NotebookPen size={17} aria-hidden />
        </button>
        <Link
          href={`/temario?vista=grafo&tema=${tema.id}`}
          aria-label="Ver temas relacionados"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-ink-2 shadow-lg"
        >
          <Network size={17} aria-hidden />
        </Link>
      </div>

      {/* nota rápida sobre el punto */}
      {nota !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setNota(null)}>
          <div
            className="w-full max-w-md rounded-xl border border-border bg-surface p-5"
            onClick={(ev) => ev.stopPropagation()}
          >
            <p className="mb-1 text-sm font-semibold text-ink">Nota sobre este punto</p>
            <p className="mb-3 text-xs text-ink-3">{actual?.puntoTitulo}</p>
            <textarea
              value={nota}
              onChange={(ev) => setNota(ev.target.value)}
              rows={5}
              autoFocus
              aria-label="Contenido de la nota"
              className="w-full rounded-lg border border-border bg-surface-2 p-3 text-sm text-ink outline-none focus:border-accent"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNota(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-ink-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void guardarNota()}
                disabled={!nota.trim() || guardandoNota}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
