import NotasLista from "@/components/notas/NotasLista";

export default function NotasPage() {
  return (
    <>
      <header className="mb-6">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
          Tu espacio
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink">Agenda</h1>
        <p className="mt-1 text-sm text-ink-2">Tu diario de estudio, en formato libre.</p>
      </header>
      <NotasLista />
    </>
  );
}
