"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  BarChart3,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Map,
  NotebookPen,
  Play,
  Star,
  X,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";

interface Props {
  nombre: string;
}

const SECCIONES = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/sesion", label: "Sesión de hoy", icon: Play },
      { href: "/calendario", label: "Calendario", icon: CalendarDays },
      { href: "/informe", label: "Informe semanal", icon: BarChart3 },
    ],
  },
  {
    label: "Tu espacio",
    items: [
      { href: "/favoritos", label: "Favoritos", icon: Star },
      { href: "/notas", label: "Agenda", icon: NotebookPen },
      { href: "/burocracia", label: "Burocracia", icon: FileText },
      { href: "/plan", label: "Plan de estudio", icon: Map },
    ],
  },
] as const;

export default function Sidebar({ nombre }: Props) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const inicial = nombre.charAt(0).toUpperCase();

  // Cierra el drawer con Escape (móvil)
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebarOpen, setSidebarOpen]);

  const nav = (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4" aria-label="Navegación principal">
      {SECCIONES.map((seccion) => (
        <div key={seccion.label}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            {seccion.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {seccion.items.map(({ href, label, icon: Icon }) => {
              const activo = pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    aria-current={activo ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      activo
                        ? "bg-accent-dim font-medium text-accent"
                        : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    <Icon size={18} aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const userCard = (
    <div className="mx-3 mb-4 flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-dim text-sm font-semibold text-accent"
        aria-hidden
      >
        {inicial}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{nombre}</p>
        <p className="text-xs text-ink-3">OIR 2026 · SAS</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 flex-col border-r border-border bg-surface md:flex">
        {nav}
        {userCard}
      </aside>

      {/* Móvil: drawer + overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-surface transition-transform duration-200 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!sidebarOpen}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
            <span className="font-display text-lg font-semibold text-ink">Opositalia</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
            className="rounded-lg p-2 text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        {nav}
        {userCard}
      </aside>
    </>
  );
}
