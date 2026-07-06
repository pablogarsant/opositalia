export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-bg px-4 py-10">
      <div className="mb-8 flex items-center gap-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
        <span className="font-display text-2xl font-semibold text-ink">Opositalia</span>
      </div>
      {children}
    </div>
  );
}
