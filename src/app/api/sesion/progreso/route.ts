import { NextResponse } from "next/server";

export async function POST() {
  // TODO: guardar progreso de sesión y actualizar dominio
  return NextResponse.json({ data: null, error: "Not implemented" }, { status: 501 });
}
