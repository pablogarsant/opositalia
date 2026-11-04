/**
 * Anota lo visto cuando se usa de verdad, no al cargar: recargar la página no gasta material.
 * Si falla solo se arriesga a repetir algún item, así que no interrumpe la sesión.
 */
export function marcarVistos(ids: (string | undefined)[]) {
  const validos = ids.filter((id): id is string => Boolean(id));
  if (!validos.length) return;
  void fetch("/api/sesion/vistos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: validos }),
  })
    .then((r) => {
      if (!r.ok) console.error(`/api/sesion/vistos: HTTP ${r.status}`);
    })
    .catch((e) => console.error("/api/sesion/vistos:", e));
}
