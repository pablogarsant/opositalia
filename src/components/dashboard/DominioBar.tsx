interface Props {
  label: string;
  dominio: number;
}

/**
 * Color por umbrales del motor de plan (CLAUDE.md):
 * <50 crítico · 50–64 bajo (refuerzo <65) · 65–69 en progreso · ≥70 dominado.
 */
function colorDominio(d: number): { texto: string; barra: string } {
  if (d < 50) return { texto: "text-danger", barra: "bg-danger" };
  if (d < 65) return { texto: "text-warn", barra: "bg-warn" };
  if (d < 70) return { texto: "text-info", barra: "bg-info" };
  return { texto: "text-ok", barra: "bg-ok" };
}

export default function DominioBar({ label, dominio }: Props) {
  const color = colorDominio(dominio);
  return (
    <div className="mb-3.5 last:mb-0">
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className="text-ink-2">{label}</span>
        <span className={`font-semibold ${color.texto}`}>{dominio}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={dominio}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Dominio de ${label}`}
        className="h-2 overflow-hidden rounded-full bg-surface-2"
      >
        <div
          className={`h-full rounded-full ${color.barra} transition-[width] duration-500`}
          style={{ width: `${dominio}%` }}
        />
      </div>
    </div>
  );
}
