import { currentUser } from "@clerk/nextjs/server";
import { getPerfil } from "@/lib/perfil";
import { getTemarioArbol } from "@/lib/temario";
import TemarioArbolVista from "@/components/temario/TemarioArbol";

export const dynamic = "force-dynamic";

export default async function TemarioPage() {
  const user = await currentUser();
  const perfil = user ? await getPerfil(user.id) : null;
  const arbol = await getTemarioArbol(perfil?.id ?? null);

  return (
    <>
      <header className="mb-5">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">
          Temario oficial · BOJA
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink">Temario FEA Oftalmología</h1>
      </header>

      {arbol.disponible ? (
        <TemarioArbolVista arbol={arbol} />
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
