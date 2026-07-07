import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPerfil } from "@/lib/perfil";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });
  const perfil = await getPerfil(userId);
  if (!perfil) return NextResponse.json({ data: null, error: "Sin perfil" }, { status: 409 });

  const { id } = await ctx.params;
  const parsed = z
    .object({ contenido: z.string().min(1).max(20000) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: "Contenido inválido" }, { status: 400 });
  }

  const upd = await supabaseAdmin()
    .from("notas")
    .update({ contenido: parsed.data.contenido, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("perfil_id", perfil.id) // solo las propias
    .select("*")
    .single();
  if (upd.error) {
    return NextResponse.json({ data: null, error: "Nota no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ data: upd.data, error: null });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });
  const perfil = await getPerfil(userId);
  if (!perfil) return NextResponse.json({ data: null, error: "Sin perfil" }, { status: 409 });

  const { id } = await ctx.params;
  const del = await supabaseAdmin()
    .from("notas")
    .delete()
    .eq("id", id)
    .eq("perfil_id", perfil.id)
    .select("id");
  if (del.error || !del.data?.length) {
    return NextResponse.json({ data: null, error: "Nota no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ data: { deleted: true }, error: null });
}
