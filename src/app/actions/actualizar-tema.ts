"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { esTema, type Tema } from "@/lib/temas";

/**
 * Persiste la paleta elegida en perfiles.tema.
 * Best-effort: si no hay sesión, perfil o Supabase, no lanza —
 * localStorage ya garantiza la persistencia local.
 */
export async function actualizarTema(tema: Tema): Promise<void> {
  if (!esTema(tema)) return;

  const { userId } = await auth();
  if (!userId) return;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  try {
    await supabaseAdmin().from("perfiles").update({ tema }).eq("clerk_id", userId);
  } catch {
    // silencioso: la preferencia local sigue funcionando
  }
}
