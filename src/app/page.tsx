import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-bg px-6 text-center">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full bg-accent" aria-hidden />
        <h1 className="font-display text-4xl font-semibold text-ink">
          Opositalia
        </h1>
      </div>
      <p className="mt-4 max-w-md text-base text-ink-2">
        Tu oposición médica, con un plan que se adapta a ti. Sesiones guiadas,
        repaso inteligente y seguimiento real de tu progreso.
      </p>
      <Link
        href="/login"
        className="mt-8 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-2"
      >
        Entrar
      </Link>
      <p className="mt-16 text-xs text-ink-3">
        OIR 2026 · Servicio Andaluz de Salud
      </p>
    </main>
  );
}
