import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPerfil } from "@/lib/perfil";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });
  const perfil = await getPerfil(userId);
  if (!perfil) return NextResponse.json({ data: [], error: null });

  const notas = await supabaseAdmin()
    .from("notas")
    .select("*")
    .eq("perfil_id", perfil.id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ data: notas.data ?? [], error: null });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });
  const perfil = await getPerfil(userId);
  if (!perfil) return NextResponse.json({ data: null, error: "Sin perfil" }, { status: 409 });

  const parsed = z
    .object({ contenido: z.string().min(1).max(20000) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: "Contenido inválido" }, { status: 400 });
  }

  const nota = await supabaseAdmin()
    .from("notas")
    .insert({ perfil_id: perfil.id, contenido: parsed.data.contenido })
    .select("*")
    .single();
  if (nota.error) {
    return NextResponse.json({ data: null, error: nota.error.message }, { status: 500 });
  }
  return NextResponse.json({ data: nota.data, error: null });
}
