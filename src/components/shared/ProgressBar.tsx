interface Props { value: number; max?: number; className?: string }

export default function ProgressBar({ value, max = 100, className = "" }: Props) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={`h-2 bg-gray-100 rounded-full overflow-hidden ${className}`}>
      <div className="h-full bg-[#2B5BA8] transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
