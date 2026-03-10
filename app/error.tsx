"use client";

import { useEffect } from "react";
import { ErrorShell } from "@/components/routes/error-shell";

type GlobalErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorShell
      badge="Route error"
      title="State route ini gagal dimuat."
      description="Ada error tak terduga saat membaca room state, provider result, atau route UI. Coba ulangi request ini dulu sebelum lanjut."
      onRetry={reset}
    />
  );
}
