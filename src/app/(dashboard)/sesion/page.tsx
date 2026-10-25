import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import SesionActiva from "@/components/sesion/SesionActiva";
import { getPerfil } from "@/lib/perfil";
import { getPlanUsuario } from "@/lib/plan/datos";
import { elegirSesionActual, hoyMadrid } from "@/lib/plan/sesion-actual";

interface Props {
  searchParams: Promise<{ id?: string; tema?: string; bloque?: string }>;
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h1 className="font-display text-lg font-semibold text-ink">{titulo}</h1>
      <p className="mt-1 text-sm text-ink-2">{texto}</p>
      <Link
        href="/plan"
        className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-2"
      >
        Ver el plan
      </Link>
    </div>
  );
}

export default async function SesionPage({ searchParams }: Props) {
  const params = await searchParams;

  // Desde el informe llega ?tema=<bloque> para sesiones de refuerzo fuera del plan
  if (!params.id && params.tema) {
    return <SesionActiva tema={params.tema} bloque={params.bloque ?? params.tema} />;
  }

  const { userId } = await auth();
  const perfil = userId ? await getPerfil(userId) : null;
  if (!perfil) {
    return <Aviso titulo="Perfil no encontrado" texto="Vuelve a iniciar sesión; si persiste, avísanos." />;
  }

  // getPlanUsuario solo trae sesiones de la inscripción de esta usuaria:
  // un ?id ajeno no aparece y cae en "no encontrada"
  const { inscripcion, sesiones } = await getPlanUsuario(perfil.id);
  if (!inscripcion) {
    return <Aviso titulo="Aún no tienes plan de estudio" texto="Configúralo y aquí aparecerá tu sesión del día." />;
  }

  const hoy = hoyMadrid();
  const sesion = params.id ? sesiones.find((s) => s.id === params.id) : elegirSesionActual(sesiones, hoy);
  if (!sesion) {
    return params.id ? (
      <Aviso titulo="Sesión no encontrada" texto="Esa sesión no pertenece a tu plan." />
    ) : (
      <Aviso titulo="No quedan sesiones pendientes" texto="Has terminado el plan o no hay sesiones desde hoy." />
    );
  }

  const tema = sesion.tema_titulo ?? sesion.bloque_titulo ?? "Sesión";
  const programadaPara =
    sesion.fecha_programada === hoy
      ? undefined
      : new Date(sesion.fecha_programada + "T00:00:00").toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

  return (
    <SesionActiva
      tema={tema}
      bloque={sesion.bloque_titulo ?? tema}
      temaId={sesion.tema_id}
      sesionPlanId={sesion.id}
      programadaPara={programadaPara}
    />
  );
}
