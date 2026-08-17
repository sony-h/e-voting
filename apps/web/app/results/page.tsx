'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { listElections } from '@/services/elections';
import { Badge } from '@/components/ui/badge';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  SCHEDULED: 'default',
  ACTIVE: 'outline',
  CLOSED: 'destructive',
};

const STATUS_CLASS: Record<string, string> = {
  DRAFT: '',
  SCHEDULED: '',
  ACTIVE: 'border-success/40 bg-success/10 text-success',
  CLOSED: '',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
};

function formatPeriod(election: { start_at: Date | null; end_at: Date | null }) {
  if (!election.start_at || !election.end_at) return 'Periode belum diatur';
  const start = new Date(election.start_at).toLocaleDateString('id-ID');
  const end = new Date(election.end_at).toLocaleDateString('id-ID');
  return `${start} – ${end}`;
}

export default function PublicResultsPage() {
  const router = useRouter();
  const { data: elections, isLoading } = useQuery({
    queryKey: ['elections'],
    queryFn: listElections,
  });

  const sorted = [...(elections ?? [])].sort((a, b) => (a.order ?? 1) - (b.order ?? 1));

  // Fallback: redirect to single election if only one exists
  useEffect(() => {
    const first = sorted[0];
    if (!isLoading && sorted.length === 1 && first) {
      router.replace(`/results/${first.id}`);
    }
  }, [isLoading, sorted, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Memuat...</p>
      </main>
    );
  }

  if (sorted.length === 0) {
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
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            ← Kembali
          </Link>
          <div className="mt-12 rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Belum ada pemilihan.
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
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          ← Kembali
        </Link>

        <div className="mt-6 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Hasil Pemilihan
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">Semua Hasil</h1>
        </div>

        <div className="mt-10 space-y-4">
          {sorted.map((election) => (
            <Link
              key={election.id}
              href={`/results/${election.id}`}
              className="flex items-center justify-between rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <h2 className="font-heading text-lg font-bold">{election.title}</h2>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {formatPeriod(election)}
                </p>
              </div>
              <Badge
                variant={STATUS_VARIANT[election.status]}
                className={STATUS_CLASS[election.status]}
              >
                {STATUS_LABEL[election.status]}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
