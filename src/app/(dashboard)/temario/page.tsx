import { currentUser } from "@clerk/nextjs/server";
import { getPerfil } from "@/lib/perfil";
import { getRelacionesTemas, getTemarioArbol } from "@/lib/temario";
import TemarioVista from "@/components/temario/TemarioVista";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ vista?: string; tema?: string }>;
}

export default async function TemarioPage({ searchParams }: Props) {
  const { vista, tema } = await searchParams;
  const user = await currentUser();
  const perfil = user ? await getPerfil(user.id) : null;
  const [arbol, relaciones] = await Promise.all([
    getTemarioArbol(perfil?.id ?? null),
    getRelacionesTemas(),
  ]);

  return (
    <>
      <header className="mb-5">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
          Temario oficial · BOJA
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink">Temario FEA Oftalmología</h1>
      </header>

      {arbol.disponible ? (
        <TemarioVista
          arbol={arbol}
          relaciones={relaciones}
          vistaInicial={vista === "grafo" ? "grafo" : vista === "arbol" ? "arbol" : undefined}
          temaInicial={tema}
        />
      ) : (
        <div className="rounded-xl border border-warn/40 bg-warn-dim p-6">
          <p className="font-medium text-ink">El temario aún no está cargado</p>
          <p className="mt-1 text-sm text-ink-2">
            Aplica la migración <code>0005_temario_arbol.sql</code> en Supabase y ejecuta
            <code className="ml-1">npx tsx scripts/seed_temario_oficial.ts</code>.
          </p>
        </div>
      )}
    </>
  );
}
