"use client";

import { JoinRoomInline } from "@/components/rooms/join-room-inline";

type JoinRoomModalProps = {
  joinCode: string;
};

export function JoinRoomModal({ joinCode }: JoinRoomModalProps) {
  return (
    <div className="grain min-h-screen bg-background px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
        <div className="w-full max-w-lg rounded-[2rem] border border-line bg-surface p-3 shadow-2xl">
          <div className="rounded-[1.6rem] border border-line bg-card p-6 shadow-lg">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
              Masuk ke room
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-primary md:text-4xl">
              Tulis nama dulu sebelum masuk.
            </h1>
            <p className="mt-4 text-sm leading-7 text-foreground">
              Supaya room tetap rapi dan setiap lokasi tercatat atas nama yang
              benar, kamu perlu masuk sebagai anggota dulu.
            </p>

            <div className="mt-6">
              <JoinRoomInline initialJoinCode={joinCode} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
