"use client";

export default function Mnemotecnia({ texto }: { texto: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
      {texto}
    </div>
  );
}
