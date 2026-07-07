import { auth } from "@clerk/nextjs/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente Supabase server-side autenticado como el usuario actual mediante
 * el JWT template "supabase" de Clerk. Las políticas RLS (migración 0003)
 * identifican al usuario por auth.jwt()->>'sub' = perfiles.clerk_id.
 *
 * Requiere: template "supabase" creado en el dashboard de Clerk con claims
 * {"role": "authenticated", "sub": "{{user.id}}"} y el JWT secret compartido
 * configurado en Supabase. Sin sesión, el cliente queda como anon (RLS deniega).
 */
export async function createClient() {
  const { getToken } = await auth();
  const token = await getToken({ template: "supabase" }).catch(() => null);
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
