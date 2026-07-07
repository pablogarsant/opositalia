"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, MessageCircle, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Props {
  tema: string;
  bloque: string;
  fase: number;
}

interface Mensaje {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWidget({ tema, bloque, fase }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [generando, setGenerando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const bloqueado = fase === 5;

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviar = async () => {
    const mensaje = input.trim();
    if (!mensaje || generando || bloqueado) return;
    setInput("");
    setGenerando(true);
    const historial = mensajes.slice(-10);
    setMensajes((prev) => [...prev, { role: "user", content: mensaje }, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje, tema_actual: tema, bloque, fase, historial }),
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
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      setMensajes((prev) => {
        const copia = [...prev];
        copia[copia.length - 1] = { role: "assistant", content: `⚠️ ${msg}` };
        return copia;
      });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {abierto && (
        <div className="mb-3 flex h-[420px] w-80 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Consultor OIR</p>
              <p className="text-[11px] text-ink-3">{bloqueado ? "Bloqueado en simulacro" : tema}</p>
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
              <p className="p-4 text-center text-[13px] text-ink-3">
                Pregunta cualquier duda del tema: respondo con el contexto del Kanski.
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
                    <div className="flex flex-col gap-2 [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_strong]:font-semibold">
                      <ReactMarkdown
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
              disabled={bloqueado || generando}
              placeholder={bloqueado ? "No disponible en el simulacro" : "Escribe tu duda…"}
              aria-label="Mensaje al consultor"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-3 focus:border-accent disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => void enviar()}
              disabled={bloqueado || generando || !input.trim()}
              aria-label="Enviar"
              className="rounded-lg bg-accent p-2.5 text-accent-fg hover:bg-accent-2 disabled:opacity-50"
            >
              <Send size={15} aria-hidden />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={bloqueado ? "Consultor bloqueado durante el simulacro" : "Abrir consultor IA"}
        className={`ml-auto flex h-13 w-13 items-center justify-center rounded-full p-3.5 shadow-lg transition-transform hover:scale-105 ${
          bloqueado ? "bg-surface-2 text-ink-3" : "bg-accent text-accent-fg"
        }`}
      >
        {bloqueado ? <Lock size={20} aria-hidden /> : <MessageCircle size={22} aria-hidden />}
      </button>
    </div>
  );
}
