import { NextResponse } from "next/server";

export async function POST() {
  // TODO: generar mnemotecnias con Anthropic
  return NextResponse.json({ data: null, error: "Not implemented" }, { status: 501 });
}
