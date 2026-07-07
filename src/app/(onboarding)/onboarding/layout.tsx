import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getPerfil } from "@/lib/perfil";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const perfil = user ? await getPerfil(user.id) : null;
  // si ya completó el onboarding, no tiene nada que hacer aquí
  if (perfil?.onboarding_completado === true) redirect("/dashboard");

  return <div className="flex min-h-dvh flex-col bg-bg">{children}</div>;
}
