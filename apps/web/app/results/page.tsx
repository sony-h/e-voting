'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listElections } from '@/services/elections';
import { getPublicResults } from '@/services/results';
import { FestiveResults, FireConfetti } from '@/components/results/festive-results';

export default function PublicResultsPage() {
  const { data: elections } = useQuery({ queryKey: ['elections'], queryFn: listElections });
  const election = elections?.find((e) => e.status === 'CLOSED') ?? elections?.[0];
  const electionId = election?.id ?? '';

  const { data: results, isError } = useQuery({
    queryKey: ['public-results', electionId],
    queryFn: () => getPublicResults(electionId),
    enabled: !!electionId,
    retry: false,
    refetchInterval: 5000,
  });

  const notPublished = isError && election?.status !== undefined && election.status !== 'ACTIVE';

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
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          ← Kembali
        </Link>

        <div className="mt-6 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Hasil Pemilihan
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">
            {election?.title ?? 'Hasil Pemilihan'}
          </h1>
        </div>

        {!electionId ? (
          <div className="mt-12 rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Belum ada election.
          </div>
        ) : !results && isError && notPublished ? (
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
