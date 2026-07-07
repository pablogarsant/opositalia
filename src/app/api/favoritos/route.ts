import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPerfil } from "@/lib/perfil";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });
  const perfil = await getPerfil(userId);
  if (!perfil) return NextResponse.json({ data: [], error: null });

  const bloque = req.nextUrl.searchParams.get("bloque");
  let q = supabaseAdmin()
    .from("favoritos")
    .select("*")
    .eq("perfil_id", perfil.id)
    .order("created_at", { ascending: false });
  if (bloque) q = q.eq("bloque", bloque);
  const favoritos = await q;
  return NextResponse.json({ data: favoritos.data ?? [], error: null });
}

const postSchema = z.object({
  tipo: z.enum(["flashcard", "idea_clave", "mnemotecnia", "pregunta", "texto"]),
  titulo: z.string().max(300).nullish(),
  contenido: z.record(z.string(), z.unknown()),
  bloque: z.string().max(100).nullish(),
  tema_id: z.string().uuid().nullish(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });
  const perfil = await getPerfil(userId);
  if (!perfil) return NextResponse.json({ data: null, error: "Sin perfil" }, { status: 409 });

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: "Body inválido" }, { status: 400 });
  }

  const fav = await supabaseAdmin()
    .from("favoritos")
    .insert({ ...parsed.data, perfil_id: perfil.id })
    .select("*")
    .single();
  if (fav.error) {
    return NextResponse.json({ data: null, error: fav.error.message }, { status: 500 });
  }
  return NextResponse.json({ data: fav.data, error: null });
}
