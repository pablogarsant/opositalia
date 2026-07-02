import { create } from "zustand";
import { TEMA_STORAGE_KEY, type Tema } from "@/lib/temas";

interface UIStore {
  tema: Tema;
  sidebarOpen: boolean;
  /** Cambia la paleta: DOM + localStorage. La persistencia a Supabase la dispara el componente. */
  setTema: (tema: Tema) => void;
  /** Sincroniza el store con el tema ya aplicado por el script anti-FOUC (sin re-persistir). */
  hydrateTema: (tema: Tema) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  tema: "cielo",
  sidebarOpen: false,
  setTema: (tema) => {
    document.documentElement.dataset.theme = tema;
    try {
      localStorage.setItem(TEMA_STORAGE_KEY, tema);
    } catch {
      // localStorage no disponible (modo privado): el tema aplica solo en sesión
    }
    set({ tema });
  },
  hydrateTema: (tema) => set({ tema }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
