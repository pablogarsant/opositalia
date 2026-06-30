import { create } from "zustand";

interface SesionStore {
  faseActual: 1 | 2 | 3 | 4 | 5;
  temaId: string | null;
  iniciada: boolean;
  setFase: (fase: 1 | 2 | 3 | 4 | 5) => void;
  iniciarSesion: (temaId: string) => void;
  resetSesion: () => void;
}

export const useSesionStore = create<SesionStore>((set) => ({
  faseActual: 1,
  temaId: null,
  iniciada: false,
  setFase: (faseActual) => set({ faseActual }),
  iniciarSesion: (temaId) => set({ temaId, iniciada: true, faseActual: 1 }),
  resetSesion: () => set({ faseActual: 1, temaId: null, iniciada: false }),
}));
