import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getPerfil } from "@/lib/perfil";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // El middleware garantiza sesión; currentUser solo puede ser null en edge cases
  const user = await currentUser();
  const perfil = user ? await getPerfil(user.id) : null;

  // arranque guiado: sin perfil (webhook pendiente) o sin onboarding → /onboarding.
  // Comparación con false (no falsy): si la migración 0004 aún no está aplicada,
  // la columna no viene y los usuarios existentes siguen entrando al dashboard.
  if (!perfil || perfil.onboarding_completado === false) {
    redirect("/onboarding");
  }

  const nombre =
    perfil?.nombre ?? [user?.firstName, user?.lastName].filter(Boolean).join(" ") ?? "Opositora";

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-bg">
      <Topbar temaInicial={perfil?.tema} />
      <div className="flex flex-1">
        <Sidebar nombre={nombre || "Opositora"} />
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
