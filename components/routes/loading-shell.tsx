type LoadingShellProps = {
  badge: string;
  title: string;
  description: string;
};

export function LoadingShell({
  badge,
  title,
  description,
}: LoadingShellProps) {
  return (
    <main className="grain min-h-screen px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between rounded-full border border-line bg-surface px-4 py-3 shadow-[0_12px_40px_rgba(31,27,23,0.08)]">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-coral text-sm font-bold text-white">
              H
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">
                Hangout
              </p>
              <p className="text-xs text-muted">Loading route</p>
            </div>
          </div>
          <div className="h-8 w-24 animate-pulse rounded-full bg-white/80" />
        </div>

        <section className="rounded-[2rem] border border-line bg-surface p-7 shadow-[0_20px_60px_rgba(31,27,23,0.12)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            {badge}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted md:text-lg">
            {description}
          </p>
          <div className="mt-8 space-y-3">
            <div className="h-24 animate-pulse rounded-[1.5rem] border border-line bg-white/80" />
            <div className="h-24 animate-pulse rounded-[1.5rem] border border-line bg-white/70" />
            <div className="h-24 animate-pulse rounded-[1.5rem] border border-line bg-white/60" />
          </div>
        </section>
      </div>
    </main>
  );
}
