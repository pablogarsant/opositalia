"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface Props {
  tipo: "flashcard" | "idea_clave" | "mnemotecnia" | "pregunta" | "texto";
  titulo?: string | null;
  contenido: Record<string, unknown>;
  bloque?: string | null;
}

/** Estrella para guardar un artefacto de sesión en favoritos (optimista). */
export default function FavoritoButton({ tipo, titulo, contenido, bloque }: Props) {
  const [guardado, setGuardado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    if (guardado || enviando) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/favoritos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, titulo: titulo ?? null, contenido, bloque: bloque ?? null }),
      });
      if (res.ok) setGuardado(true);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void guardar()}
      disabled={enviando}
      aria-label={guardado ? "Guardado en favoritos" : "Guardar en favoritos"}
      title={guardado ? "Guardado" : "Guardar en favoritos"}
      className={`rounded p-1.5 transition-colors ${
        guardado ? "text-warn" : "text-ink-3 hover:bg-surface-2 hover:text-warn"
      }`}
    >
      <Star size={16} fill={guardado ? "currentColor" : "none"} aria-hidden />
    </button>
  );
}
