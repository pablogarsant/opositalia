import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // TODO: generar mnemotecnias con Anthropic
  return NextResponse.json({ data: null, error: "Not implemented" }, { status: 501 });
}
