import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // TODO: guardar progreso de sesión y actualizar dominio
  return NextResponse.json({ data: null, error: "Not implemented" }, { status: 501 });
}
