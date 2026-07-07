import SesionActiva from "@/components/sesion/SesionActiva";

interface Props {
  searchParams: Promise<{ tema?: string; bloque?: string }>;
}

export default async function SesionPage({ searchParams }: Props) {
  const params = await searchParams;
  // sin query: tema demo (coincide con la "sesión de hoy" del dashboard).
  // Desde el informe llega ?tema=<bloque> para sesiones de refuerzo.
  const tema = params.tema ?? "Párpados";
  const bloque = params.bloque ?? params.tema ?? "Órbita y párpados";
  return <SesionActiva tema={tema} bloque={bloque} />;
}
