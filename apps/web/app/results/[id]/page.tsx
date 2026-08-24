'use client';

/* eslint-disable react-hooks/set-state-in-effect -- revealing countdown state sync is intentional */

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import { getElection } from '@/services/elections';
import { getPublicResults } from '@/services/results';
import { Progress } from '@/components/ui/progress';
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

  const [revealing, setRevealing] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const wasNotPublishedRef = useRef(false);

  useEffect(() => {
    if (notPublished) wasNotPublishedRef.current = true;
  }, [notPublished]);

  useEffect(() => {
    if (results && wasNotPublishedRef.current && !revealing) {
      wasNotPublishedRef.current = false;
      setRevealing(true);
      setCountdown(10);
    }
  }, [results, revealing]);

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
      wasNotPublishedRef.current = false;
    }
  }, [notPublished, revealing]);

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

        {revealing ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 rounded-2xl border bg-card p-8 text-center shadow-sm"
          >
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Hasil akan ditampilkan
            </p>
            <motion.p
              key={countdown}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-4 font-heading text-6xl font-bold tabular-nums sm:text-7xl"
            >
              {countdown}
            </motion.p>
            <p className="mt-2 text-sm text-muted-foreground">detik lagi</p>
            <Progress value={(10 - countdown) * 10} className="mx-auto mt-6 max-w-sm" />
            <p className="mt-3 font-mono text-xs text-muted-foreground">{election.title}</p>
          </motion.div>
        ) : notPublished ? (
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
