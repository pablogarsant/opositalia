import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import SesionActiva from "@/components/sesion/SesionActiva";
import { getPerfil } from "@/lib/perfil";
import { getPlanUsuario } from "@/lib/plan/datos";
import { elegirSesionActual, hoyMadrid } from "@/lib/plan/sesion-actual";
import { getTemaLibro } from "@/lib/temario";

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

const fechaLarga = (fecha: string) =>
  new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

const tituloSesion = (s: { tema_titulo: string | null; bloque_titulo: string | null }) =>
  s.tema_titulo ?? s.bloque_titulo ?? "Sesión";

function OpcionSesion(props: {
  etiqueta: string;
  titulo: string;
  detalle: string;
  href: string;
  accion: string;
  principal?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-surface-2 p-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">{props.etiqueta}</p>
        <p className="mt-1 font-medium text-ink">{props.titulo}</p>
        <p className="text-xs text-ink-3">{props.detalle}</p>
      </div>
      <Link
        href={props.href}
        className={`self-start rounded-lg px-4 py-2 text-sm font-medium ${
          props.principal
            ? "bg-accent text-accent-fg hover:bg-accent-2"
            : "border border-border bg-surface text-ink-2 hover:border-border-2"
        }`}
      >
        {props.accion}
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
  if (params.id && !sesion) {
    return <Aviso titulo="Sesión no encontrada" texto="Esa sesión no pertenece a tu plan." />;
  }

  // Sin sesión para hoy no se arranca sola: se ofrece la siguiente o repasar la última
  if (!sesion || (!params.id && sesion.fecha_programada !== hoy)) {
    // sesiones ya viene ordenada por fecha y orden: la última completada es la final
    const ultima = sesiones.filter((s) => s.estado === "completada").at(-1);
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="font-display text-lg font-semibold text-ink">
          {ultima?.fecha_programada === hoy ? "Ya has hecho la sesión de hoy" : "Hoy no tienes sesión programada"}
        </h1>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {sesion ? (
            <OpcionSesion
              etiqueta={`Siguiente · ${fechaLarga(sesion.fecha_programada)}`}
              titulo={tituloSesion(sesion)}
              detalle={sesion.es_refuerzo ? "Refuerzo por dominio bajo" : sesion.tipo}
              href={`/sesion?id=${sesion.id}`}
              accion="Empezar ahora"
              principal
            />
          ) : (
            <p className="text-sm text-ink-2">No quedan sesiones pendientes en tu plan.</p>
          )}
          {ultima && (
            <OpcionSesion
              etiqueta={`Última completada · ${fechaLarga(ultima.fecha_programada)}`}
              titulo={tituloSesion(ultima)}
              detalle="Rehacerla cuenta como repaso"
              href={`/sesion?id=${ultima.id}`}
              accion="Repasar"
            />
          )}
        </div>
      </div>
    );
  }

  const tema = tituloSesion(sesion);
  const programadaPara = sesion.fecha_programada === hoy ? undefined : fechaLarga(sesion.fecha_programada);
  // la lectura de la fase 4 va por los puntos oficiales del tema
  const libro = sesion.tema_id ? await getTemaLibro(sesion.tema_id, perfil.id) : null;
  const puntos = (libro?.subtemas ?? []).flatMap((s) =>
    s.puntos.map((p) => ({ id: p.id, titulo: p.titulo, subtema: s.titulo }))
  );

  return (
    <SesionActiva
      tema={tema}
      bloque={sesion.bloque_titulo ?? tema}
      temaId={sesion.tema_id}
      sesionPlanId={sesion.id}
      programadaPara={programadaPara}
      puntos={puntos}
    />
  );
}
