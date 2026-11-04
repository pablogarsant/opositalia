import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPerfil } from "@/lib/perfil";
import { supabaseAdmin } from "@/lib/supabase/admin";

const bodySchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(50) });

/** Anota tarjetas o preguntas como vistas para no repetírselas a esta alumna. */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });
  const perfil = await getPerfil(userId);
  if (!perfil) return NextResponse.json({ data: null, error: "Perfil no encontrado" }, { status: 409 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ data: null, error: "Body inválido" }, { status: 400 });

  const visto_en = new Date().toISOString();
  const r = await supabaseAdmin()
    .from("items_vistos")
    .upsert(
      parsed.data.ids.map((item_id) => ({ perfil_id: perfil.id, item_id, visto_en })),
      { onConflict: "perfil_id,item_id" }
    );
  if (r.error) return NextResponse.json({ data: null, error: `items_vistos: ${r.error.message}` }, { status: 500 });
  return NextResponse.json({ data: { vistos: parsed.data.ids.length }, error: null });
}
