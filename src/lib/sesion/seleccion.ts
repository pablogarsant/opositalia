/**
 * Elección de tarjetas y preguntas. Puro y sin imports para que
 * `node scripts/check_banco.mjs` lo pueda cargar directamente.
 */

/** Hasta `n` items: primero sin ver y al azar; después, los vistos hace más tiempo. */
export function elegirItems<T extends { id: string }>(
  items: T[],
  vistos: Map<string, string>,
  n: number,
  azar: () => number = Math.random
): T[] {
  const sinVer = items.filter((i) => !vistos.has(i.id));
  // Fisher-Yates: ordenar con un comparador aleatorio da un reparto sesgado
  for (let i = sinVer.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [sinVer[i], sinVer[j]] = [sinVer[j], sinVer[i]];
  }
  const yaVistos = items
    .filter((i) => vistos.has(i.id))
    .sort((a, b) => vistos.get(a.id)!.localeCompare(vistos.get(b.id)!));
  return [...sinVer, ...yaVistos].slice(0, n);
}
