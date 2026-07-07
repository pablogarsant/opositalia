// Paletas de color disponibles. Fuente única para store, selector y server action.

export const TEMAS = ["cielo", "salvia", "arena", "niebla", "noche"] as const;
export type Tema = (typeof TEMAS)[number];

export const TEMA_LABELS: Record<Tema, string> = {
  cielo: "Cielo",
  salvia: "Salvia",
  arena: "Arena",
  niebla: "Niebla",
  noche: "Noche",
};

/** Color de acento de cada paleta, para los swatches del selector. */
export const TEMA_SWATCHES: Record<Tema, string> = {
  cielo: "#2B5BA8",
  salvia: "#3D7A5E",
  arena: "#8B6F47",
  niebla: "#6B5EA8",
  noche: "#4ADE80",
};

export const TEMA_STORAGE_KEY = "opositalia-theme";

export function esTema(valor: string | null | undefined): valor is Tema {
  return TEMAS.includes(valor as Tema);
}
