import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateICS } from "@/lib/calendar/ics";
import { getPlanUsuario } from "@/lib/plan/datos";
import { getPerfil } from "@/lib/perfil";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ data: null, error: "No autenticado" }, { status: 401 });
  const perfil = await getPerfil(userId);
  if (!perfil) return NextResponse.json({ data: null, error: "Sin perfil" }, { status: 409 });

  const { inscripcion, sesiones } = await getPlanUsuario(perfil.id);
  if (!inscripcion) {
    return NextResponse.json({ data: null, error: "Sin plan activo" }, { status: 409 });
  }
  const horas = (inscripcion.config_plan as { horas_sesion?: number })?.horas_sesion ?? 2;
  const pendientes = sesiones.filter((s) => s.estado === "pendiente");
  const ics = generateICS(pendientes, horas);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="opositalia-plan.ics"',
    },
  });
}
