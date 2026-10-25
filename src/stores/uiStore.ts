import { create } from "zustand";
import { TEMA_STORAGE_KEY, type Tema } from "@/lib/temas";

export type ModoLectura = "scroll" | "paginas";
export type VistaTemario = "arbol" | "grafo";

/** Qué está mirando el usuario dentro de la pantalla (lo pone cada página vía useChatDetalle). */
export interface ChatDetalle {
  tema_id?: string;
  tema_titulo?: string;
  punto_id?: string;
  punto_titulo?: string;
  bloque?: string;
}

interface UIStore {
  tema: Tema;
  sidebarOpen: boolean;
  chatAbierto: boolean;
  chatDetalle: ChatDetalle | null;
  modoLectura: ModoLectura;
  vistaTemario: VistaTemario;
  /** Cambia la paleta: DOM + localStorage. La persistencia a Supabase la dispara el componente. */
  setTema: (tema: Tema) => void;
  /** Sincroniza el store con el tema ya aplicado por el script anti-FOUC (sin re-persistir). */
  hydrateTema: (tema: Tema) => void;
  setSidebarOpen: (open: boolean) => void;
  setChatAbierto: (open: boolean) => void;
  setChatDetalle: (detalle: ChatDetalle | null) => void;
  setModoLectura: (modo: ModoLectura) => void;
  setVistaTemario: (vista: VistaTemario) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  tema: "cielo",
  sidebarOpen: false,
  chatAbierto: false,
  chatDetalle: null,
  modoLectura: "scroll",
  vistaTemario: "arbol",
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
  setChatAbierto: (chatAbierto) => set({ chatAbierto }),
  setChatDetalle: (chatDetalle) => set({ chatDetalle }),
  setModoLectura: (modoLectura) => set({ modoLectura }),
  setVistaTemario: (vistaTemario) => set({ vistaTemario }),
}));
