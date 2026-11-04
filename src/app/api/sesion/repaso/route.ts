import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getPerfil } from "@/lib/perfil";
import { tarjetasDeRepaso } from "@/lib/sesion/banco";

// puede generar un lote de tarjetas de la sesión anterior
export const maxDuration = 120;

/** Tarjetas de la fase 1. Si fallan, la sesión sigue: la fase 1 se salta. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });
  const perfil = await getPerfil(userId);
  if (!perfil) return NextResponse.json({ data: null, error: "Perfil no encontrado" }, { status: 409 });

  try {
    return NextResponse.json({ data: { tarjetas: await tarjetasDeRepaso(perfil.id) }, error: null });
  } catch (e) {
    console.error(`repaso perfil=${perfil.id}:`, e instanceof Error ? e.message : e);
    return NextResponse.json({ data: { tarjetas: [] }, error: null });
  }
}
