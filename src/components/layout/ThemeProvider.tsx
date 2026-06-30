"use client";

import { createContext, useContext, useState } from "react";

type Theme = "cielo" | "salvia" | "arena" | "niebla" | "noche";

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: "cielo",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("cielo");
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useThemeContext = () => useContext(ThemeContext);
