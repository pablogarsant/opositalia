import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string;
  valueSuffix?: string;
  sub: string;
}

export default function StatCard({ icon: Icon, label, value, valueSuffix, sub }: Props) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 md:p-5">
      <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-accent-dim text-accent">
        <Icon size={16} aria-hidden />
      </span>
      <p className="text-xs text-ink-3">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink md:text-[26px]">
        {value}
        {valueSuffix && <span className="text-base text-ink-3">{valueSuffix}</span>}
      </p>
      <p className="mt-0.5 text-xs text-ink-2">{sub}</p>
    </div>
  );
}
