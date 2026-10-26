import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getPerfil } from "@/lib/perfil";
import { getTemaLibro } from "@/lib/temario";
import VistaLibro from "@/components/temario/VistaLibro";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ temaId: string }>;
  searchParams: Promise<{ punto?: string; subtema?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { temaId } = await params;
  const tema = await getTemaLibro(temaId, null);
  return { title: tema ? `${tema.titulo} — Opositalia` : "Temario — Opositalia" };
}

export default async function TemaLibroPage({ params, searchParams }: Props) {
  const { temaId } = await params;
  const { punto, subtema } = await searchParams;

  const user = await currentUser();
  const perfil = user ? await getPerfil(user.id) : null;
  const tema = await getTemaLibro(temaId, perfil?.id ?? null);
  if (!tema) notFound();

  return <VistaLibro tema={tema} puntoInicial={punto} subtemaInicial={subtema} />;
}
