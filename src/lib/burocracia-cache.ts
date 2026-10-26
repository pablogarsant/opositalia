import { DATOS_FALLBACK, datosSchema, type DatosBurocracia } from "@/lib/burocracia";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Datos de burocracia para la app: SOLO lectura de burocracia_cache, nunca busca
 * en internet (eso lo hace a mano `node scripts/actualizar_burocracia.mjs`).
 * Una fila con forma antigua o inválida no se muestra: se usa el fallback y se registra.
 */
export async function getBurocracia(): Promise<{ datos: DatosBurocracia; actualizado: string | null }> {
  const r = await supabaseAdmin()
    .from("burocracia_cache")
    .select("datos, updated_at")
    .eq("convocatoria", "OIR-SAS")
    .maybeSingle();
  if (r.error) console.error("burocracia_cache: lectura fallida, se usa el fallback:", r.error.message);
  if (!r.data) return { datos: DATOS_FALLBACK, actualizado: null };

  const valido = datosSchema.safeParse(r.data.datos);
  if (!valido.success) {
    console.error(
      `burocracia_cache: datos con forma antigua o inválida (${valido.error.issues[0]?.path.join(".")}), se usa el fallback`
    );
    return { datos: DATOS_FALLBACK, actualizado: null };
  }
  return { datos: valido.data, actualizado: r.data.updated_at };
}
