'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import { getElection } from '@/services/elections';
import { getPublicResults } from '@/services/results';
import { FestiveResults, FireConfetti } from '@/components/results/festive-results';

export default function ElectionResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: election, isLoading: electionLoading } = useQuery({
    queryKey: ['election', id],
    queryFn: () => getElection(id),
    retry: false,
  });

  const {
    data: results,
    isError,
    error,
  } = useQuery({
    queryKey: ['public-results', id],
    queryFn: () => getPublicResults(id),
    enabled: !!id,
    retry: false,
    refetchInterval: 5000,
  });

  const errorCode = error instanceof ApiError ? error.errorCode : null;
  const notPublished = isError && errorCode === 'RESULTS_NOT_PUBLISHED';

  if (electionLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Memuat...</p>
      </main>
    );
  }

  if (!election) {
    return (
      <main className="relative min-h-screen overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, var(--hero-tint), transparent)',
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 py-14">
          <Link
            href="/results"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            ← Kembali ke Semua Hasil
          </Link>
          <div className="mt-12 rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Election tidak ditemukan.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, var(--hero-tint), transparent)',
        }}
      />
      <div className="relative mx-auto max-w-3xl px-6 py-14">
        <Link
          href="/results"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          ← Kembali ke Semua Hasil
        </Link>

        <div className="mt-6 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Hasil Pemilihan
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">{election.title}</h1>
        </div>

        {notPublished ? (
          <div className="mt-12 rounded-xl border border-dashed p-12 text-center">
            <p className="text-4xl">⏳</p>
            <h2 className="mt-3 font-heading text-xl font-bold">Hasil belum ditampilkan</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Panitia akan menampilkan hasil pemilihan di halaman ini. Silakan tunggu dan kembali
              lagi.
            </p>
          </div>
        ) : !results ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">Memuat hasil...</p>
        ) : (
          <div className="mt-10">
            <FireConfetti />
            <FestiveResults results={results} />
          </div>
        )}

        <p className="mt-10 text-center font-mono text-xs text-muted-foreground">
          Halaman ini diperbarui otomatis.
        </p>
      </div>
    </main>
  );
}
