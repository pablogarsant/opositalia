import { NextResponse } from "next/server";

export async function POST() {
  // TODO: generar contenido de sesión con IA (flashcards, mapa, preguntas)
  return NextResponse.json({ data: null, error: "Not implemented" }, { status: 501 });
}
