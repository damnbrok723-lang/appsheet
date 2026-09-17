"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("OfficeHub page error", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center p-6">
      <section className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">Halaman gagal dimuat</h1>
        <p className="mt-2 text-sm text-muted-foreground">Coba muat ulang halaman. Data yang sudah tersimpan tidak berubah.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={() => reset()} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Coba lagi</button>
          <a href="/dashboard" className="rounded-md border px-4 py-2 text-sm font-medium">Dashboard</a>
        </div>
      </section>
    </main>
  );
}
