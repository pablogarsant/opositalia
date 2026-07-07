"use client";

import { Bell, LogOut, Menu } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import PaletteSelector from "./PaletteSelector";
import { useUIStore } from "@/stores/uiStore";

interface Props {
  temaInicial?: string | null;
}

export default function Topbar({ temaInicial }: Props) {
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menú"
          className="rounded-lg p-2 text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink md:hidden"
        >
          <Menu size={20} aria-hidden />
        </button>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
          <span className="font-display text-lg font-semibold text-ink">
            Opositalia
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <PaletteSelector temaInicial={temaInicial} />
        <button
          type="button"
          aria-label="Notificaciones (próximamente)"
          title="Próximamente"
          disabled
          className="rounded-lg p-2 text-ink-3"
        >
          <Bell size={18} aria-hidden />
        </button>
        <SignOutButton redirectUrl="/">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg p-2 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <LogOut size={18} aria-hidden />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </SignOutButton>
      </div>
    </header>
  );
}
