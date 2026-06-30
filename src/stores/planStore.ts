import { create } from "zustand";
import type { SesionPlan } from "@/lib/plan/types";

interface PlanStore {
  sesiones: SesionPlan[];
  setSesiones: (sesiones: SesionPlan[]) => void;
  actualizarSesion: (id: string, updates: Partial<SesionPlan>) => void;
}

export const usePlanStore = create<PlanStore>((set) => ({
  sesiones: [],
  setSesiones: (sesiones) => set({ sesiones }),
  actualizarSesion: (id, updates) =>
    set((state) => ({
      sesiones: state.sesiones.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
}));
