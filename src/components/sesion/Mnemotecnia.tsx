"use client";

export default function Mnemotecnia({ texto }: { texto: string }) {
  return (
    <div className="rounded-lg border border-warn/30 bg-warn-dim p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-warn">Mnemotecnia</p>
      <p className="mt-1 text-[13px] text-ink">{texto}</p>
    </div>
  );
}
