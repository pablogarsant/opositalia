import SesionActiva from "@/components/sesion/SesionActiva";

export default function SesionPage() {
  // Tema demo hasta que el plan (fase 4) dicte la sesión del día.
  // Coincide con la "sesión de hoy" hardcodeada del dashboard.
  return <SesionActiva tema="Párpados" bloque="Órbita y párpados" />;
}
