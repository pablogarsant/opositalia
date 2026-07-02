import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PerfilRow } from "@/types/database";

/**
 * Lee el perfil por clerk_id. Solo servidor: el clerkId debe venir de
 * auth() de Clerk, nunca de input del usuario.
 *
 * Decisión Fase 1: se usa el cliente admin porque las políticas RLS
 * dependen de `app.clerk_id`, que aún no se inyecta por sesión
 * (llegará en Fase 3 con el JWT template de Clerk para Supabase).
 * El filtro explícito por clerk_id mantiene el aislamiento por usuario.
 *
 * Resiliente: sin Supabase configurado (dev) devuelve null en vez de lanzar.
 * cache(): deduplica la query dentro del mismo render (layout + page).
 */
export const getPerfil = cache(async (clerkId: string): Promise<PerfilRow | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    const { data } = await supabaseAdmin()
      .from("perfiles")
      .select("*")
      .eq("clerk_id", clerkId)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
});
