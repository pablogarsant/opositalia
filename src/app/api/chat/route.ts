import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // TODO: implementar chatbot consultor con Anthropic
  return NextResponse.json({ data: null, error: "Not implemented" }, { status: 501 });
}
