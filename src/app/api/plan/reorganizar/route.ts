import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // TODO: reorganizar plan tras sesión perdida o resultado bajo
  return NextResponse.json({ data: null, error: "Not implemented" }, { status: 501 });
}
