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
        <div className="flex items-center justify-between rounded-full border border-line bg-surface px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              H
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">
                Hangout
              </p>
              <p className="text-xs text-muted">Loading route</p>
            </div>
          </div>
          <div className="h-8 w-24 animate-pulse rounded-full bg-card" />
        </div>

        <section className="rounded-3xl border border-line bg-surface p-7 shadow-xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            {badge}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-foreground md:text-lg">
            {description}
          </p>
          <div className="mt-8 space-y-3">
            <div className="h-24 animate-pulse rounded-2xl border border-line bg-card" />
            <div className="h-24 animate-pulse rounded-2xl border border-line bg-surface-strong" />
            <div className="h-24 animate-pulse rounded-2xl border border-line bg-surface-soft" />
          </div>
        </section>
      </div>
    </main>
  );
}
