import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateRoomForm } from "@/components/rooms/create-room-form";

export default function NewRoomPage() {
  return (
    <main className="grain min-h-screen px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between rounded-full border border-line bg-surface px-4 py-3 shadow-lg backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              H
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                Hangout
              </p>
              <p className="text-xs text-muted-foreground">Buat room baru</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-soft px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition hover:-translate-y-0.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5 rounded-3xl border border-line bg-surface p-7 shadow-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
              Mulai dari sini
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-primary md:text-5xl">
              Buat room buat ngajak teman ketemu.
            </h1>
            <p className="text-base leading-8 text-foreground md:text-lg">
              Isi nama acara dan nama kamu dulu. Setelah room jadi, kamu bisa
              bagikan kode room, atur preferensi tempat, lalu mulai kumpulkan
              lokasi teman-teman.
            </p>
            <div className="rounded-2xl border border-line bg-card p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                Yang akan terjadi
              </p>
              <p className="mt-3 text-sm leading-7 text-ink-soft">
                Setelah menekan tombol buat room, kamu langsung masuk ke room
                yang siap dibagikan supaya semua orang bisa join dan ikut
                menentukan titik temu.
              </p>
            </div>
          </div>

          <CreateRoomForm />
        </section>
      </div>
    </main>
  );
}
