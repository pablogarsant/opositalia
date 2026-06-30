import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // TODO: generar contenido de sesión con IA (flashcards, mapa, preguntas)
  return NextResponse.json({ data: null, error: "Not implemented" }, { status: 501 });
}
