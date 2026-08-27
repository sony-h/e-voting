'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, ArrowRight, ArrowLeft, ShieldCheck, Trophy } from 'lucide-react';
import { listElections } from '@/services/elections';
import { Badge } from '@/components/ui/badge';
import { formatPeriod } from '@/lib/format';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  SCHEDULED: 'default',
  ACTIVE: 'outline',
  CLOSED: 'destructive',
};

const STATUS_CLASS: Record<string, string> = {
  DRAFT: '',
  SCHEDULED: '',
  ACTIVE: 'border-success/40 bg-success/10 text-success font-semibold',
  CLOSED: 'border-border bg-muted text-muted-foreground font-semibold',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Terjadwal',
  ACTIVE: 'Sedang Berlangsung',
  CLOSED: 'Selesai',
};

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
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-3 font-mono text-xs text-muted-foreground">Memuat daftar hasil...</p>
        </div>
      </main>
    );
  }

  if (sorted.length === 0) {
    return (
      <main className="relative min-h-screen overflow-hidden px-6 py-14">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -10%, var(--hero-tint), transparent)',
            }}
          />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="mt-12 rounded-3xl border border-dashed bg-card/60 p-12 text-center text-sm text-muted-foreground">
            Belum ada pemilihan yang terdaftar.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden pb-16">
      {/* Ambient background mesh */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -10%, var(--hero-tint), transparent)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 pt-10">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            E-Voting SMANSA
          </span>
        </div>

        {/* Section Heading */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Rekapitulasi Suara Resmi</span>
          </div>
          <h1 className="mt-4 font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Hasil Pemilihan
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Pilih salah satu pemilihan di bawah untuk melihat rincian perolehan suara dan pemenang.
          </p>
        </div>

        {/* List of Elections */}
        <div className="mt-10 space-y-4">
          {sorted.map((electionItem) => (
            <Link
              key={electionItem.id}
              href={`/results/${electionItem.id}`}
              className="group flex items-center justify-between rounded-3xl border border-border/70 bg-card/85 p-6 shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {electionItem.title}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {electionItem.academic_year} · {formatPeriod(electionItem)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  variant={STATUS_VARIANT[electionItem.status]}
                  className={`rounded-full px-3 py-1 text-xs ${STATUS_CLASS[electionItem.status]}`}
                >
                  {STATUS_LABEL[electionItem.status]}
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>

        {/* Trustmark Footer */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success shrink-0" />
            <span>Rekapitulasi terverifikasi dan transparan oleh sistem Orivastra</span>
          </div>

          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <Image
                src="/logo-orivastra-white-circle.png"
                alt="Orivastra"
                width={20}
                height={20}
                className="h-5 w-5 object-contain"
              />
              <span className="font-heading text-xs font-bold tracking-[0.14em] text-foreground">
                ORIV<span className="text-primary">A</span>STRA
              </span>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Technology Beyond Horizons
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
