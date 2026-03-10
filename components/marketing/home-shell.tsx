import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JoinRoomInline } from "@/components/rooms/join-room-inline";
import { MVP_STATIC_ROUTES } from "@/lib/contracts";

const pillars = [
  {
    title: "Fair midpoint",
    eyebrow: "Decision engine",
    copy: "Hitung titik temu yang terasa adil dulu, baru venue dicari di sekitar area yang memang masuk akal untuk grup kecil.",
  },
  {
    title: "Venue shortlist",
    eyebrow: "Actionable output",
    copy: "Hasil akhirnya bukan sekadar koordinat, tapi shortlist tempat nongkrong yang siap dibuka ke Maps dan dibandingkan cepat.",
  },
  {
    title: "Room consensus",
    eyebrow: "Shared state",
    copy: "Room, voting, dan finalisasi jadi satu alur supaya keputusan tidak berhenti di diskusi lokasi saja.",
  },
];

const productSignals = [
  "Geometric median for midpoint fairness",
  "Venue shortlist around the meeting radius",
  "Realtime-ready room flow for voting and finalization",
];

export function HomeShell() {
  return (
    <main className="grain min-h-screen overflow-hidden">
      <section className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-10">
        <div className="flex items-center justify-between rounded-full border border-line bg-surface px-4 py-3 shadow-lg backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              H
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-foreground">
                Hangout
              </p>
              <p className="text-xs text-foreground">
                Fairness-first hangout planner
              </p>
            </div>
          </div>
          <p className="hidden font-bold text-[11px] uppercase tracking-[0.24em] text-foreground md:block">
            Live room flow ready
          </p>
        </div>

        <div className="grid gap-12 pt-12 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div className="space-y-8">
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] text-foreground md:text-7xl">
                Temukan <br />
                <span className="text-primary">titik tengah</span>, bukan debat
                yang muter terus.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-foreground md:text-xl">
                Hangout dirancang untuk bantu grup kecil share lokasi, hitung
                titik temu yang terasa adil, lihat shortlist venue, lalu
                finalize pilihan dengan cepat,{" "}
                <span className="bg-primary-soft px-2">
                  karena sesungguhnya pulang ga kejauhan adalah hak segala
                  bangsa.
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={MVP_STATIC_ROUTES.newRoom}
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5"
              >
                Create room
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="#state-of-app"
                className="inline-flex items-center justify-center rounded-full border border-line bg-surface-soft px-6 py-3 text-sm font-semibold text-foreground transition-transform duration-200 hover:-translate-y-0.5"
              >
                Lihat app status
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {productSignals.map((signal) => (
                <div
                  key={signal}
                  className="rounded-3xl border border-line bg-surface p-4 shadow-lg"
                >
                  <p className="font-bold text-[11px] uppercase tracking-[0.2em] text-primary">
                    Product signal
                  </p>
                  <p className="mt-1 text-sm font-medium leading-6 text-ink-soft">
                    {signal}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-accent/80 blur-3xl" />

            <div className="relative space-y-5 rounded-3xl border border-line bg-surface p-5 shadow-2xl backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-[11px] uppercase tracking-[0.22em] text-foreground">
                    Preview room
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                    Jakarta meetup, but fair.
                  </h2>
                </div>
                <span className="rounded-full bg-success px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">
                  midpoint ready
                </span>
              </div>

              <div className="rounded-2xl border border-line bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Room pulse</p>
                  <p className="font-bold text-xs text-foreground">
                    3 members shared
                  </p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { name: "Tara", tone: "bg-primary", distance: "7.2 km" },
                    { name: "Raka", tone: "bg-success", distance: "6.8 km" },
                    { name: "Nina", tone: "bg-accent", distance: "7.0 km" },
                  ].map((member) => (
                    <div
                      key={member.name}
                      className="rounded-2xl border border-line bg-surface-strong p-3"
                    >
                      <div
                        className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full ${member.tone} text-xs font-bold ${member.tone === "bg-accent" ? "text-accent-foreground" : "text-primary-foreground"}`}
                      >
                        {member.name[0]}
                      </div>
                      <p className="text-sm font-semibold">{member.name}</p>
                      <p className="mt-1 text-xs text-foreground">
                        Fairness span {member.distance}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[0.92fr_1.08fr]">
                <div className="rounded-2xl border border-line bg-primary p-4 text-primary-foreground">
                  <p className="font-bold text-[11px] uppercase tracking-[0.18em] text-primary-foreground/70">
                    Midpoint
                  </p>
                  <p className="mt-1 text-3xl font-semibold tracking-[-0.05em]">
                    -6.2248
                  </p>
                  <p className="font-bold text-sm text-primary-foreground/75">
                    106.8089
                  </p>
                  <p className="mt-4 text-sm leading-6 text-primary-foreground/80">
                    Radius 2 km. Shortlist fokus ke area yang masih rasional
                    untuk semua orang.
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Venue shortlist</p>
                    <p className="font-bold text-xs uppercase tracking-[0.18em] text-foreground">
                      top 3
                    </p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      "Kopi Tengah · 180m dari midpoint",
                      "Green Garden Resto · 420m dari midpoint",
                      "Taman Langsat · 600m dari midpoint",
                    ].map((venue, index) => (
                      <div
                        key={venue}
                        className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-ink-soft">
                            {venue}
                          </p>
                          <p className="mt-1 text-xs text-foreground">
                            Candidate {index + 1}
                          </p>
                        </div>
                        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                          vote-ready
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="brief"
        className="mx-auto grid max-w-7xl gap-5 px-6 pb-8 pt-6 md:px-10 lg:grid-cols-[0.95fr_1.05fr]"
      >
        <div className="grid gap-5 lg:grid-cols-1">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-3xl border border-line bg-surface p-6 shadow-lg"
            >
              <p className="font-bold text-[11px] uppercase tracking-[0.2em] text-foreground">
                {pillar.eyebrow}
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                {pillar.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-foreground">
                {pillar.copy}
              </p>
            </article>
          ))}
        </div>
        <JoinRoomInline />
      </section>

      <footer className="mx-auto max-w-7xl px-6 pb-10 pt-2 md:px-10 md:pb-12">
        <div className="flex flex-col gap-2 rounded-3xl border border-line bg-card px-5 py-4 text-sm text-foreground shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">Hangout</p>
          <p>Copyright Rayhan Yovi, 2026</p>
        </div>
      </footer>
    </main>
  );
}
