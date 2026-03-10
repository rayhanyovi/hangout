"use client";

import Link from "next/link";

type ErrorShellProps = {
  badge: string;
  title: string;
  description: string;
  onRetry?: () => void;
};

export function ErrorShell({
  badge,
  title,
  description,
  onRetry,
}: ErrorShellProps) {
  return (
    <main className="grain min-h-screen px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-[2rem] border border-line bg-surface p-8 shadow-[0_20px_60px_rgba(31,27,23,0.12)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            {badge}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted md:text-lg">
            {description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:-translate-y-0.5"
              >
                Retry
              </button>
            ) : null}
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5"
            >
              Back home
            </Link>
            <Link
              href="/rooms/new"
              className="inline-flex items-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5"
            >
              Create a room
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
