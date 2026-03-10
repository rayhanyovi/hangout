import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPinned, Vote } from "lucide-react";
import { getRoomSnapshot } from "@/lib/server/rooms/repository";

type RoomDecisionPageProps = {
  params: Promise<{
    joinCode: string;
  }>;
};

export default async function RoomDecisionPage({
  params,
}: RoomDecisionPageProps) {
  const { joinCode } = await params;
  const snapshot = await getRoomSnapshot(joinCode.toUpperCase());

  if (!snapshot) {
    notFound();
  }

  const finalizedVenueId = snapshot.room.finalizedDecision?.venueId ?? null;
  const finalizedVenue =
    finalizedVenueId !== null
      ? snapshot.venues.find((venue) => venue.venueId === finalizedVenueId) ?? null
      : null;
  const finalizedVoteCount =
    finalizedVenueId !== null
      ? snapshot.votes.filter((vote) => vote.venueId === finalizedVenueId).length
      : 0;

  return (
    <main className="grain min-h-screen px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between rounded-full border border-line bg-surface px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              H
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                Hangout
              </p>
              <p className="text-xs text-muted-foreground">Hasil akhir</p>
            </div>
          </div>
          <Link
            href={`/r/${joinCode}`}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-soft px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition hover:-translate-y-0.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke room
          </Link>
        </div>

        {finalizedVenue ? (
          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-3xl border border-line bg-surface p-7 shadow-xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                Tempat terpilih
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-primary md:text-5xl">
                {finalizedVenue.name}
              </h1>
              <p className="mt-4 text-base leading-8 text-foreground md:text-lg">
                Tempat ini sudah dikunci sebagai pilihan akhir untuk room{" "}
                <span className="font-mono text-foreground">{joinCode}</span>.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-line bg-card p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                    Kategori
                  </p>
                  <p className="mt-2 text-sm font-semibold uppercase text-foreground">
                    {finalizedVenue.category}
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-card p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                    Jarak
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {finalizedVenue.distanceToCenterM} m dari titik temu
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-card p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                    Total suara
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {finalizedVoteCount} suara
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={finalizedVenue.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5"
                >
                  Buka di Maps
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Link
                  href={`/r/${joinCode}`}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5"
                >
                  Kembali ke room
                </Link>
              </div>
            </article>

            <article className="rounded-3xl border border-line bg-surface p-7 shadow-xl">
              <div className="flex items-center gap-2">
                <MapPinned className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-primary">
                  Detail tempat
                </p>
              </div>
              <p className="mt-4 text-sm leading-7 text-foreground">
                Buka lokasi ini di Maps, lalu pakai ringkasan di bawah untuk
                melihat hasil voting akhirnya.
              </p>

              {finalizedVenue.address ? (
                <div className="mt-5 rounded-2xl border border-line bg-card p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                    Alamat
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {finalizedVenue.address}
                  </p>
                </div>
              ) : null}

              <div className="mt-5 rounded-2xl border border-line bg-card p-4">
                <div className="flex items-center gap-2">
                  <Vote className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-primary">
                    Ringkasan voting
                  </p>
                </div>
                <div className="mt-4 space-y-3">
                  {snapshot.venues.map((venue) => {
                    const voteCount = snapshot.votes.filter(
                      (vote) => vote.venueId === venue.venueId,
                    ).length;

                    return (
                      <div
                        key={venue.venueId}
                        className="flex items-center justify-between rounded-[1rem] border border-line bg-surface px-3 py-3"
                      >
                        <p className="text-sm font-medium text-foreground">
                          {venue.name}
                        </p>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {voteCount} suara
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          </section>
        ) : (
          <section className="rounded-3xl border border-line bg-surface p-7 shadow-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
              Tempat terpilih
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-primary">
              Belum ada tempat yang dikunci.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-foreground">
              Voting masih berjalan. Tunggu host memilih hasil akhirnya setelah
              semua orang selesai menentukan pilihan.
            </p>
            <div className="mt-6">
              <Link
                href={`/r/${joinCode}`}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5"
              >
                Kembali ke room
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
