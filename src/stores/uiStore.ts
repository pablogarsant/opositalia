import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  theme: string;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  theme: "cielo",
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setTheme: (theme) => set({ theme }),
}));
