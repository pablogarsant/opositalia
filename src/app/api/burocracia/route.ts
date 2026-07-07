import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getBurocracia } from "@/lib/burocracia";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });

  const resultado = await getBurocracia();
  return NextResponse.json({ data: resultado, error: null });
}
