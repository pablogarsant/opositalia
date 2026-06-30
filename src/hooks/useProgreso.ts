"use client";

import { useState, useCallback } from "react";

export function useProgreso(temaId: string) {
  const [dominio, setDominio] = useState(0);
  const [loading, setLoading] = useState(false);

  const actualizarProgreso = useCallback(async (nuevoDominio: number) => {
    setLoading(true);
    // TODO: persistir en Supabase
    setDominio(nuevoDominio);
    setLoading(false);
  }, []);

  return { dominio, loading, actualizarProgreso };
}
