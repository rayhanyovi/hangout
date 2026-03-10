import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JoinRoomInline } from "@/components/rooms/join-room-inline";
import { MVP_STATIC_ROUTES } from "@/lib/contracts";

const pillars = [
  {
    title: "Fair midpoint",
    eyebrow: "Decision engine",
    copy:
      "Hitung titik temu yang terasa adil dulu, baru venue dicari di sekitar area yang memang masuk akal untuk grup kecil.",
  },
  {
    title: "Venue shortlist",
    eyebrow: "Actionable output",
    copy:
      "Hasil akhirnya bukan sekadar koordinat, tapi shortlist tempat nongkrong yang siap dibuka ke Maps dan dibandingkan cepat.",
  },
  {
    title: "Room consensus",
    eyebrow: "Shared state",
    copy:
      "Room, voting, dan finalisasi jadi satu alur supaya keputusan tidak berhenti di diskusi lokasi saja.",
  },
];

const productSignals = [
  "Geometric median for midpoint fairness",
  "Venue shortlist around the meeting radius",
  "Realtime-ready room flow for voting and finalization",
];

const stateCards = [
  {
    title: "Live room flow",
    status: "Ready now",
    copy:
      "Create room, join room, location sharing, fairness summary, voting, dan final decision sekarang sudah hidup di root app.",
  },
  {
    title: "Venue boundary",
    status: "Protected",
    copy:
      "Venue retrieval sekarang lewat server boundary dengan cache, rate limiting, cancellation, dan structured logs.",
  },
  {
    title: "Cutover blockers",
    status: "Still open",
    copy:
      "Durable persistence, parity clean-up, dan final Vercel rollout masih jadi langkah terakhir sebelum app ini bisa dianggap benar-benar production-ready.",
  },
];

export function HomeShell() {
  return (
    <main className="grain min-h-screen overflow-hidden">
      <section className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-10">
        <div className="flex items-center justify-between rounded-full border border-line bg-surface px-4 py-3 shadow-[0_12px_40px_rgba(31,27,23,0.08)] backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-coral text-sm font-bold text-white">
              H
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">
                Hangout
              </p>
              <p className="text-xs text-muted">
                Fairness-first hangout planner
              </p>
            </div>
          </div>
          <p className="hidden font-mono text-[11px] uppercase tracking-[0.24em] text-muted md:block">
            Live room flow ready
          </p>
        </div>

        <div className="grid gap-12 pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white/65 px-3 py-1 text-xs font-medium text-ink-soft shadow-[0_10px_24px_rgba(31,27,23,0.06)]">
              <span className="h-2 w-2 rounded-full bg-teal" />
              Routing fairness into a real product
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-foreground md:text-7xl">
                Temuin titik tengah, bukan debat yang muter terus.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted md:text-xl">
                Hangout dirancang untuk bantu grup kecil share lokasi, hitung
                titik temu yang terasa adil, lihat shortlist venue, lalu
                finalize pilihan dengan cepat.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={MVP_STATIC_ROUTES.newRoom}
                className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-transform duration-200 hover:-translate-y-0.5"
              >
                Create room
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="#state-of-app"
                className="inline-flex items-center justify-center rounded-full border border-line bg-white/60 px-6 py-3 text-sm font-semibold text-foreground transition-transform duration-200 hover:-translate-y-0.5"
              >
                Lihat app status
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {productSignals.map((signal) => (
                <div
                  key={signal}
                  className="rounded-[1.6rem] border border-line bg-surface p-4 shadow-[0_18px_45px_rgba(31,27,23,0.08)]"
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                    Product signal
                  </p>
                  <p className="mt-3 text-sm font-medium leading-6 text-ink-soft">
                    {signal}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-10 h-32 w-32 rounded-full bg-coral/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-teal/18 blur-3xl" />

            <div className="relative space-y-5 rounded-[2rem] border border-line bg-[rgba(255,249,240,0.88)] p-5 shadow-[0_28px_80px_rgba(31,27,23,0.12)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                    Preview room
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                    Jakarta meetup, but fair.
                  </h2>
                </div>
                <span className="rounded-full bg-teal px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                  midpoint ready
                </span>
              </div>

              <div className="rounded-[1.5rem] border border-line bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Room pulse</p>
                  <p className="font-mono text-xs text-muted">3 members shared</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { name: "Tara", tone: "bg-coral", distance: "7.2 km" },
                    { name: "Raka", tone: "bg-teal", distance: "6.8 km" },
                    { name: "Nina", tone: "bg-sun", distance: "7.0 km" },
                  ].map((member) => (
                    <div
                      key={member.name}
                      className="rounded-[1.2rem] border border-line bg-surface-strong p-3"
                    >
                      <div
                        className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full ${member.tone} text-xs font-bold text-white`}
                      >
                        {member.name[0]}
                      </div>
                      <p className="text-sm font-semibold">{member.name}</p>
                      <p className="mt-1 text-xs text-muted">
                        Fairness span {member.distance}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[0.92fr_1.08fr]">
                <div className="rounded-[1.5rem] border border-line bg-foreground p-4 text-background">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-background/70">
                    Midpoint
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
                    -6.2248
                  </p>
                  <p className="font-mono text-sm text-background/72">
                    106.8089
                  </p>
                  <p className="mt-4 text-sm leading-6 text-background/74">
                    Radius 2 km. Shortlist fokus ke area yang masih rasional
                    untuk semua orang.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-line bg-white/82 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Venue shortlist</p>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
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
                        className="flex items-center justify-between rounded-[1rem] border border-line bg-surface px-3 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-ink-soft">
                            {venue}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            Candidate {index + 1}
                          </p>
                        </div>
                        <span className="rounded-full bg-coral/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-coral">
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
              className="rounded-[2rem] border border-line bg-surface p-6 shadow-[0_18px_45px_rgba(31,27,23,0.08)]"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                {pillar.eyebrow}
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                {pillar.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted">{pillar.copy}</p>
            </article>
          ))}
        </div>
        <JoinRoomInline />
      </section>

      <section
        id="state-of-app"
        className="mx-auto max-w-7xl px-6 pb-16 pt-4 md:px-10 md:pb-20"
      >
        <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="rounded-[2rem] border border-line bg-foreground p-7 text-background shadow-[0_20px_60px_rgba(31,27,23,0.16)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-background/70">
              State of app
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">
              Room planner ini sudah jadi produk kerja, bukan shell migrasi.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-background/75">
              Root app sekarang memegang flow utama Hangout end-to-end. Prototype
              Lovable masih berguna sebagai bahan parity review, tapi bukan lagi
              tempat development utama.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {stateCards.map((track) => (
              <article
                key={track.title}
                className="rounded-[1.75rem] border border-line bg-white/72 p-5 shadow-[0_18px_45px_rgba(31,27,23,0.08)]"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  {track.status}
                </p>
                <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em]">
                  {track.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted">{track.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
