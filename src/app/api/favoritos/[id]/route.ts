import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getPerfil } from "@/lib/perfil";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });
  const perfil = await getPerfil(userId);
  if (!perfil) return NextResponse.json({ data: null, error: "Sin perfil" }, { status: 409 });

  const { id } = await ctx.params;
  const del = await supabaseAdmin()
    .from("favoritos")
    .delete()
    .eq("id", id)
    .eq("perfil_id", perfil.id)
    .select("id");
  if (del.error || !del.data?.length) {
    return NextResponse.json({ data: null, error: "Favorito no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ data: { deleted: true }, error: null });
}
