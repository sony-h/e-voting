'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import type { CandidateImage } from '@e-voting/types';
import { listElections } from '@/services/elections';
import { listPublicCandidates } from '@/services/candidates';
import { uploadUrl } from '@/lib/images';
import { formatPeriod } from '@/lib/format';
import { fadeUp, EASE } from '@/lib/animations';
import { BallotStamp, type BallotStatus } from '@/components/ui/ballot-stamp';
import { Skeleton } from '@/components/ui/skeleton';

function GalleryCarousel({ images }: { images: CandidateImage[] }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;
  const current = images[index % images.length]!;
  const go = (dir: number) => setIndex((i) => (i + dir + images.length) % images.length);

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-muted/40">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <Image
            src={uploadUrl(current.url) ?? ''}
            alt={current.caption ?? 'Gambar program'}
            width={1280}
            height={720}
            className="aspect-video w-full object-contain"
          />
        </motion.div>
        {current.caption && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="absolute bottom-0 left-0 right-0 bg-black/50 px-4 py-2 text-sm font-medium text-white"
          >
            {current.caption}
          </motion.p>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Sebelumnya"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-lg text-white transition-colors hover:bg-black/60"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Berikutnya"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-lg text-white transition-colors hover:bg-black/60"
            >
              ›
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              aria-label={`Gambar ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === index ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CandidateDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const candidateId = params.id;
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const parallaxY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 60]), {
    stiffness: 120,
    damping: 30,
  });

  const { data: elections } = useQuery({
    queryKey: ['elections'],
    queryFn: listElections,
    retry: false,
  });
  const election = elections?.find((e) => e.status === 'ACTIVE') ?? elections?.[0];
  const status: BallotStatus = (election?.status as BallotStatus) ?? 'DRAFT';

  const { data: candidates, isLoading } = useQuery({
    queryKey: ['public-candidates', election?.id],
    queryFn: () => listPublicCandidates(election!.id),
    enabled: !!election?.id,
    retry: false,
  });

  const candidate = candidates?.find((c) => c.id === candidateId);
  const index = candidates?.findIndex((c) => c.id === candidateId) ?? -1;
  const prev = index > 0 ? candidates?.[index - 1] : null;
  const next = index >= 0 && index < (candidates?.length ?? 0) - 1 ? candidates?.[index + 1] : null;

  if (isLoading || !election) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-8 h-80 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-6 w-2/3" />
        <Skeleton className="mt-3 h-4 w-1/2" />
        <Skeleton className="mt-8 h-24 w-full" />
      </main>
    );
  }

  if (!candidate) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="font-heading text-3xl font-bold">Kandidat tidak ditemukan</h1>
        <p className="mt-2 text-muted-foreground">
          Kandidat mungkin telah dihapus atau tautan tidak valid.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90"
        >
          Kembali ke Beranda
        </Link>
      </main>
    );
  }

  const photo = uploadUrl(candidate.photo_url);
  const images = candidate.images ?? [];

  const heroAnim = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 24, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.7, ease: EASE },
      };

  return (
    <main className="min-h-screen">
      <div className="relative">
        <motion.div
          aria-hidden
          style={{ y: reduced ? 0 : parallaxY }}
          className="pointer-events-none absolute inset-0"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -10%, var(--hero-tint), transparent)',
            }}
          />
        </motion.div>
        <div className="relative mx-auto max-w-3xl px-6 py-10">
          <motion.div {...fadeUp()}>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              ← Kembali
            </Link>
          </motion.div>

          <motion.div {...fadeUp(0.05)} className="mt-6 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {election.title} · {election.academic_year}
            </p>
            <div className="mt-4 flex justify-center">
              <BallotStamp status={status} />
            </div>
          </motion.div>

          <motion.div {...heroAnim} className="relative mt-8">
            {photo ? (
              <Image
                src={photo}
                alt={candidate.chairman_name}
                width={1200}
                height={900}
                priority
                className="aspect-[4/3] w-full rounded-2xl object-cover shadow-sm"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground">
                No foto
              </div>
            )}
            <motion.span
              initial={reduced ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.25 }}
              className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary font-mono text-lg font-bold text-primary-foreground shadow-sm"
            >
              {candidate.candidate_number}
            </motion.span>
          </motion.div>

          <div className="mt-6 text-center">
            <motion.h1 {...fadeUp(0.1)} className="font-heading text-3xl font-bold sm:text-4xl">
              {candidate.chairman_name}
            </motion.h1>
            {candidate.vice_chairman_name && (
              <motion.p {...fadeUp(0.18)} className="mt-2 text-lg text-muted-foreground">
                & {candidate.vice_chairman_name}
              </motion.p>
            )}
          </div>

          {images.length > 0 && (
            <motion.div {...fadeUp(0.15)} className="mt-10">
              <h2 className="font-heading text-xl font-semibold">Program &amp; Kegiatan</h2>
              <div className="mt-3">
                <GalleryCarousel images={images} />
              </div>
            </motion.div>
          )}

          <div className="mt-10 space-y-8">
            <motion.section {...fadeUp()}>
              <h2 className="font-heading text-xl font-semibold">Visi</h2>
              <p className="mt-3 whitespace-pre-line text-muted-foreground">{candidate.vision}</p>
            </motion.section>
            <motion.section {...fadeUp(0.1)}>
              <h2 className="font-heading text-xl font-semibold">Misi</h2>
              <p className="mt-3 whitespace-pre-line text-muted-foreground">{candidate.mission}</p>
            </motion.section>
          </div>

          <motion.div
            {...fadeUp()}
            className="mt-12 rounded-2xl border bg-card p-8 text-center shadow-sm"
          >
            <h2 className="font-heading text-2xl font-bold">Sudah menentukan pilihanmu?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Gunakan NIS/NISN dan Token Voting dari panitia untuk memilih pemimpinmu.
            </p>
            <Link
              href="/student/login"
              className="mt-6 inline-flex h-12 w-full max-w-sm items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md"
            >
              Siap Memilih — Klik di Sini
            </Link>
          </motion.div>

          <motion.div {...fadeUp()} className="mt-8 flex items-center justify-between gap-4">
            {prev ? (
              <button
                type="button"
                onClick={() => router.push(`/candidate/${prev.id}`)}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                ‹ {prev.chairman_name}
              </button>
            ) : (
              <span />
            )}
            <Link
              href="/"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              Lihat semua kandidat
            </Link>
            {next ? (
              <button
                type="button"
                onClick={() => router.push(`/candidate/${next.id}`)}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {next.chairman_name} ›
              </button>
            ) : (
              <span />
            )}
          </motion.div>

          <motion.p
            {...fadeUp(0.05)}
            className="mt-6 text-center font-mono text-xs text-muted-foreground"
          >
            {formatPeriod(election)}
          </motion.p>
        </div>
      </div>
    </main>
  );
}
