"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Lock, MessageCircle, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useUIStore } from "@/stores/uiStore";
import { useSesionStore } from "@/stores/sesionStore";

interface Mensaje {
  role: "user" | "assistant";
  content: string;
}

/** Nombre de pantalla que entiende el system prompt (deriva de la ruta). */
export function pantallaDesdeRuta(pathname: string): string {
  return pathname.split("/").filter(Boolean)[0] ?? "dashboard";
}

/**
 * Consultor IA global: vive en el layout del dashboard, así que aparece en
 * todas las pantallas. Único bloqueo: fase 5 (simulacro) dentro de /sesion.
 */
export default function ChatWidget() {
  const pathname = usePathname();
  const pantalla = pantallaDesdeRuta(pathname);
  const abierto = useUIStore((s) => s.chatAbierto);
  const setAbierto = useUIStore((s) => s.setChatAbierto);
  const detalle = useUIStore((s) => s.chatDetalle);
  const faseSesion = useSesionStore((s) => s.faseActual);

  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [generando, setGenerando] = useState(false);
  const [aviso, setAviso] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  // la fase solo cuenta como contexto si de verdad estamos en la sesión
  const enSesion = pantalla === "sesion";
  const bloqueado = enSesion && faseSesion === 5;

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviar = async () => {
    const mensaje = input.trim();
    if (!mensaje || generando || bloqueado) return;
    setInput("");
    setGenerando(true);
    const historial = mensajes.slice(-10);
    setMensajes((prev) => [
      ...prev,
      { role: "user", content: mensaje },
      { role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje,
          historial,
          contexto: {
            pantalla,
            ...(detalle ?? {}),
            ...(enSesion ? { fase_sesion: faseSesion } : {}),
          },
        }),
      });
      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? `HTTP ${res.status}`);
      }

      // lee el SSE token a token y va pintando
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lineas = buffer.split("\n\n");
        buffer = lineas.pop() ?? "";
        for (const linea of lineas) {
          const data = linea.replace(/^data:\s*/, "").trim();
          if (!data || data === "[DONE]") continue;
          const evento = JSON.parse(data) as { token?: string; error?: string };
          if (evento.error) throw new Error(evento.error);
          if (evento.token) {
            setMensajes((prev) => {
              const copia = [...prev];
              copia[copia.length - 1] = {
                role: "assistant",
                content: copia[copia.length - 1].content + evento.token,
              };
              return copia;
            });
          }
        }
      }
    } catch {
      // mensaje amigable: el detalle técnico no le sirve a la alumna
      setMensajes((prev) => {
        const copia = [...prev];
        copia[copia.length - 1] = {
          role: "assistant",
          content: "No pude conectar ahora mismo. Inténtalo de nuevo en unos segundos.",
        };
        return copia;
      });
    } finally {
      setGenerando(false);
    }
  };

  const subtitulo = detalle?.punto_titulo ?? detalle?.tema_titulo ?? "Pregúntame lo que quieras";

  return (
    // z-40: por encima de la UI, por debajo de los modales (z-50)
    <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end md:right-6">
      {abierto && !bloqueado && (
        <div className="chat-panel-in mb-3 flex h-[min(560px,calc(100dvh-7rem))] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Consultor OIR</p>
              <p className="truncate text-[11px] text-ink-3">{subtitulo}</p>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar chat"
              className="rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
            >
              <X size={16} aria-hidden />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {mensajes.length === 0 && (
              <p className="p-4 text-center text-[13px] leading-relaxed text-ink-3">
                Pregúntame lo que necesites: temario, dudas clínicas, cómo funciona Opositalia o
                datos de la convocatoria.
              </p>
            )}
            <div className="flex flex-col gap-2.5">
              {mensajes.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "self-end bg-accent text-accent-fg"
                      : "self-start border border-border bg-surface-2 text-ink"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="flex flex-col gap-2 [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_strong]:font-semibold [&_table]:w-full [&_td]:border-b [&_td]:border-border [&_td]:py-1 [&_th]:border-b [&_th]:border-border [&_th]:py-1 [&_th]:text-left">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // sin jerarquía de headings dentro del chat
                          h1: ({ children }) => <p className="font-semibold">{children}</p>,
                          h2: ({ children }) => <p className="font-semibold">{children}</p>,
                          h3: ({ children }) => <p className="font-semibold">{children}</p>,
                        }}
                      >
                        {m.content || (generando && i === mensajes.length - 1 ? "…" : "")}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              ))}
            </div>
            <div ref={finRef} />
          </div>

          <div className="flex gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void enviar()}
              disabled={generando}
              placeholder="Escribe tu duda…"
              aria-label="Mensaje al consultor"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-3 focus:border-accent disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => void enviar()}
              disabled={generando || !input.trim()}
              aria-label="Enviar"
              className="rounded-lg bg-accent p-2.5 text-accent-fg hover:bg-accent-2 disabled:opacity-50"
            >
              <Send size={15} aria-hidden />
            </button>
          </div>
        </div>
      )}

      {bloqueado && aviso && (
        <p
          role="status"
          className="mb-3 max-w-56 rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-ink-2 shadow-lg"
        >
          El asistente no está disponible durante el simulacro.
        </p>
      )}

      <button
        type="button"
        onClick={() => (bloqueado ? setAviso((v) => !v) : setAbierto(!abierto))}
        aria-label={bloqueado ? "Consultor bloqueado durante el simulacro" : "Abrir consultor IA"}
        aria-expanded={abierto && !bloqueado}
        className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 ${
          bloqueado ? "bg-surface-2 text-ink-3" : "bg-accent text-accent-fg"
        }`}
      >
        {bloqueado ? (
          <Lock size={20} aria-hidden />
        ) : abierto ? (
          <X size={22} aria-hidden />
        ) : (
          <MessageCircle size={22} aria-hidden />
        )}
      </button>
    </div>
  );
}
