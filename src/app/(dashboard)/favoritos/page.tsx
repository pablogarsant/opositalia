import FavoritosLista from "@/components/favoritos/FavoritosLista";

export default function FavoritosPage() {
  return (
    <>
      <header className="mb-6">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
          Tu espacio
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink">Favoritos</h1>
        <p className="mt-1 text-sm text-ink-2">
          Todo lo que guardaste con la estrella durante las sesiones.
        </p>
      </header>
      <FavoritosLista />
    </>
  );
}
