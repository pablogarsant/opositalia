import type { TipoSesion } from "@/lib/plan/types";

const ESTILOS: Record<TipoSesion, string> = {
  lectura: "bg-info-dim text-info",
  repaso: "bg-warn-dim text-warn",
  examen: "bg-danger-dim text-danger",
};

const LABELS: Record<TipoSesion, string> = {
  lectura: "Lectura",
  repaso: "Repaso",
  examen: "Examen",
};

export default function SessionTypeBadge({ type }: { type: TipoSesion }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTILOS[type]}`}
    >
      {LABELS[type]}
    </span>
  );
}
