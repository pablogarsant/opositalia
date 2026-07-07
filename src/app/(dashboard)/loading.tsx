export default function DashboardLoading() {
  // skeleton compartido de todas las páginas del dashboard (server streaming)
  return (
    <div aria-busy="true" aria-label="Cargando">
      <div className="mb-6">
        <div className="mb-2 h-3 w-32 animate-pulse rounded bg-surface-2" />
        <div className="h-8 w-64 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-surface" />
        ))}
      </div>
      <div className="mb-6 h-32 animate-pulse rounded-xl border border-border bg-surface" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-xl border border-border bg-surface" />
        <div className="h-48 animate-pulse rounded-xl border border-border bg-surface" />
      </div>
    </div>
  );
}
