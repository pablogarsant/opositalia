"use client";

import { useEffect } from "react";
import { useUIStore, type ChatDetalle } from "@/stores/uiStore";

/**
 * Publica en el store qué está mirando el usuario para que el ChatWidget global
 * lo mande como contexto. Se limpia al desmontar: sin detalle stale al navegar.
 */
export function useChatDetalle(detalle: ChatDetalle) {
  const setChatDetalle = useUIStore((s) => s.setChatDetalle);
  // dep estable: el objeto literal cambia de identidad en cada render
  const clave = JSON.stringify(detalle);

  useEffect(() => {
    setChatDetalle(JSON.parse(clave) as ChatDetalle);
    return () => setChatDetalle(null);
  }, [clave, setChatDetalle]);
}
