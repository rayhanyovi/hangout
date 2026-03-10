import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateRoomForm } from "@/components/rooms/create-room-form";

export default function NewRoomPage() {
  return (
    <main className="grain min-h-screen px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between rounded-full border border-line bg-surface px-4 py-3 shadow-[0_12px_40px_rgba(31,27,23,0.08)] backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-coral text-sm font-bold text-white">
              H
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">
                Hangout
              </p>
              <p className="text-xs text-muted">Create room flow</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition hover:-translate-y-0.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5 rounded-[2rem] border border-line bg-surface p-7 shadow-[0_20px_60px_rgba(31,27,23,0.12)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              Route: /rooms/new
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-5xl">
              Host setup dimulai dari sini.
            </h1>
            <p className="text-base leading-8 text-muted md:text-lg">
              Untuk bikin room baru sekarang cukup isi nama acara dan nama host
              dulu. Pengaturan seperti transport mode, radius, dan preferensi
              venue bisa dilanjutkan setelah masuk ke room.
            </p>
            <div className="rounded-[1.5rem] border border-line bg-white/80 p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                Current phase
              </p>
              <p className="mt-3 text-sm leading-7 text-ink-soft">
                Submit form sekarang langsung membuat room persisted dengan join
                code nyata dari input minimum. Host diarahkan ke room yang sama,
                lalu setting lanjutan tinggal diteruskan di route live room.
              </p>
            </div>
          </div>

          <CreateRoomForm />
        </section>
      </div>
    </main>
  );
}
