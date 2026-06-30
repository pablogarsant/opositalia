type SessionType = "lectura" | "repaso" | "examen";

const styles: Record<SessionType, string> = {
  lectura: "bg-blue-100 text-blue-700",
  repaso: "bg-amber-100 text-amber-700",
  examen: "bg-red-100 text-red-700",
};

export default function SessionTypeBadge({ type }: { type: SessionType }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[type]}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}
