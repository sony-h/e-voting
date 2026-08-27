'use client';

/* eslint-disable react-hooks/set-state-in-effect -- revealing countdown state sync is intentional */

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Hourglass, Clock, ArrowLeft, ShieldCheck } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { getElection } from '@/services/elections';
import { getPublicResults } from '@/services/results';
import { Progress } from '@/components/ui/progress';
import { FestiveResults, FireConfetti } from '@/components/results/festive-results';
import { formatPeriod } from '@/lib/format';

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

  const [revealing, setRevealing] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [hasPendingReveal, setHasPendingReveal] = useState(false);

  useEffect(() => {
    if (notPublished) setHasPendingReveal(true);
  }, [notPublished]);

  useEffect(() => {
    if (results && hasPendingReveal && !revealing) {
      setHasPendingReveal(false);
      setRevealing(true);
      setCountdown(10);
    }
  }, [results, hasPendingReveal, revealing]);

  useEffect(() => {
    if (!revealing) return;
    const interval = setInterval(() => setCountdown((n) => Math.max(0, n - 1)), 1000);
    const timeout = setTimeout(() => setRevealing(false), 10000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [revealing]);

  useEffect(() => {
    if (notPublished && revealing) {
      setRevealing(false);
      setCountdown(10);
      setHasPendingReveal(false);
    }
  }, [notPublished, revealing]);

  if (electionLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-3 font-mono text-xs text-muted-foreground">Memuat hasil pemilihan...</p>
        </div>
      </main>
    );
  }

  if (!election) {
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
            href="/results"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Semua Hasil</span>
          </Link>
          <div className="mt-12 rounded-3xl border border-dashed p-12 text-center text-sm text-muted-foreground bg-card/60">
            Pemilihan tidak ditemukan.
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
        {/* Navigation bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/results"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </Link>
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            E-Voting SMANSA
          </span>
        </div>

        {/* Section Header */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Hasil Pemilihan Resmi</span>
          </div>
          <h1 className="mt-4 font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {election.title}
          </h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {election.academic_year} · {formatPeriod(election)}
          </p>
        </div>

        {/* Dynamic Display States */}
        {revealing || (results && hasPendingReveal) ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 overflow-hidden rounded-3xl border border-primary/40 bg-card/90 p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Clock className="h-7 w-7 animate-spin duration-3000" />
            </div>

            <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary font-bold">
              Hasil Sedang Diungkapkan
            </p>

            <motion.p
              key={countdown}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-4 font-heading text-7xl sm:text-8xl font-bold tabular-nums text-foreground tracking-tight"
            >
              {countdown}
            </motion.p>
            <p className="mt-2 font-mono text-xs text-muted-foreground uppercase tracking-wider">
              Detik Menuju Pengumuman Resmi
            </p>

            <div className="mx-auto mt-6 max-w-sm">
              <Progress value={(10 - countdown) * 10} className="h-2" />
            </div>
          </motion.div>
        ) : notPublished ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border/80 bg-card/60 p-10 sm:p-12 text-center backdrop-blur-md shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
              <Hourglass className="h-8 w-8 text-primary/70 animate-pulse" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Hasil Belum Ditampilkan
            </h2>
            <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-muted-foreground">
              Panitia penyelenggara pemilihan akan segera mempublikasikan hasil rekapitulasi di
              halaman ini setelah proses verifikasi selesai.
            </p>
          </div>
        ) : !results ? (
          <div className="mt-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              Memuat hasil rekapitulasi...
            </p>
          </div>
        ) : (
          <div key={id} className="mt-10">
            <FireConfetti />
            <FestiveResults results={results} />
          </div>
        )}

        {/* Security & Verification Trustmark Footer */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success shrink-0" />
            <span>Rekapitulasi terenkripsi &amp; terverifikasi oleh sistem Orivastra</span>
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
