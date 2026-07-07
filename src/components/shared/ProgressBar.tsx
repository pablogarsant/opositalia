interface Props {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

export default function ProgressBar({ value, max = 100, label, className = "" }: Props) {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={`h-1.5 overflow-hidden rounded-full bg-border ${className}`}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
