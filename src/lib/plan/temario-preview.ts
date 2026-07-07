import mapa from "../../../scripts/rag/kanski_chapter_map.json";
import type { BloquePlan } from "./generador";

/**
 * Temario para el preview del onboarding, derivado del mismo
 * kanski_chapter_map.json que usa el seed (fuente única, ids sintéticos).
 * Horas por tema: misma fórmula que scripts/seed_temario.ts (~25 págs/hora).
 */
export const BLOQUES_PREVIEW: BloquePlan[] = (() => {
  const bloques = new Map<string, BloquePlan>();
  for (const cap of mapa.capitulos) {
    if (!bloques.has(cap.bloque_oir)) {
      bloques.set(cap.bloque_oir, { id: cap.bloque_oir, titulo: cap.bloque_oir, temas: [] });
    }
    bloques.get(cap.bloque_oir)!.temas.push({
      id: String(cap.numero),
      titulo: cap.titulo_es,
      horas: Math.max(1, Math.round((cap.paginas[1] - cap.paginas[0]) / 25)),
    });
  }
  return [...bloques.values()];
})();
