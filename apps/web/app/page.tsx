'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import type { CandidateWithImages } from '@/services/candidates';
import { listElections } from '@/services/elections';
import { listPublicCandidates } from '@/services/candidates';
import { formatPeriod } from '@/lib/format';
import { uploadUrl } from '@/lib/images';
import { fadeUp } from '@/lib/animations';
import { BallotStamp, type BallotStatus } from '@/components/ui/ballot-stamp';
import { PortraitFrame } from '@/components/ui/portrait-frame';

function FloatingBallot() {
  const reduced = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [14, -14]), {
    stiffness: 150,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-14, 14]), {
    stiffness: 150,
    damping: 20,
  });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <motion.div
      className="relative mx-auto h-40 w-40 [perspective:700px]"
      onMouseMove={onMouseMove}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <motion.div
        style={reduced ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="absolute inset-0"
      >
        <div className="absolute inset-0 rounded-[2rem] border-2 border-dashed border-primary/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary shadow-lg"
            style={{ transform: 'translateZ(40px)' }}
          >
            <svg
              className="h-12 w-12 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div
          className="absolute -right-2 top-6 h-8 w-8 rounded-full bg-success/20"
          style={{ transform: 'translateZ(70px)' }}
        />
        <div
          className="absolute -left-3 bottom-8 h-12 w-12 rounded-full bg-primary/10"
          style={{ transform: 'translateZ(55px)' }}
        />
      </motion.div>
      <div
        aria-hidden
        className="absolute inset-x-8 -bottom-6 h-6 rounded-full bg-primary/15 blur-xl"
        style={{ transform: 'rotateX(75deg)' }}
      />
    </motion.div>
  );
}

function TiltCard({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), {
    stiffness: 200,
    damping: 25,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 200,
    damping: 25,
  });

  return (
    <motion.div
      className="h-full [perspective:900px]"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
        mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
    >
      <motion.div
        style={reduced ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow duration-200 hover:shadow-xl"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function ProgramCarousel({ images }: { images: CandidateWithImages['images'] }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!images || images.length <= 1 || reduced || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), 3000);
    return () => clearInterval(id);
  }, [images, reduced, paused]);

  if (!images || images.length === 0) return null;
  const current = images[index % images.length]!;
  const go = (dir: number) => setIndex((i) => (i + dir + images.length) % images.length);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      className="mt-2"
    >
      <div className="relative overflow-hidden rounded-lg">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.28 }}
        >
          <PortraitFrame
            src={uploadUrl(current.url) ?? ''}
            alt={current.caption ?? 'Gambar program'}
          />
        </motion.div>
        {current.caption && (
          <p className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-2 py-1 text-[10px] font-medium text-white">
            {current.caption}
          </p>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Sebelumnya"
              onClick={(e) => {
                e.preventDefault();
                go(-1);
              }}
              className="absolute left-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-sm text-white transition-colors hover:bg-black/60"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Berikutnya"
              onClick={(e) => {
                e.preventDefault();
                go(1);
              }}
              className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-sm text-white transition-colors hover:bg-black/60"
            >
              ›
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              aria-label={`Gambar ${i + 1}`}
              onClick={(e) => {
                e.preventDefault();
                setIndex(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-200 ${i === index ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: CandidateWithImages }) {
  const images = candidate.images ?? [];

  return (
    <TiltCard>
      <Link href={`/candidate/${candidate.id}`} className="group flex h-full flex-col">
        <div className="relative">
          {candidate.photo_url ? (
            <PortraitFrame
              src={uploadUrl(candidate.photo_url) ?? ''}
              alt={candidate.chairman_name}
              priority
            />
          ) : (
            <div className="flex aspect-[3/4] w-full items-center justify-center bg-muted text-sm text-muted-foreground">
              No foto
            </div>
          )}
          <span
            className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary font-mono text-sm font-bold text-primary-foreground shadow-sm"
            style={{ transform: 'translateZ(30px)' }}
          >
            {candidate.candidate_number}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4" style={{ transform: 'translateZ(20px)' }}>
          <h3 className="font-heading text-lg font-semibold">{candidate.chairman_name}</h3>
          <p className="text-sm text-muted-foreground">
            {candidate.vice_chairman_name ? `& ${candidate.vice_chairman_name}` : '—'}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{candidate.vision}</p>

          {images.length > 0 && (
            <div className="mt-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Program
              </p>
              <ProgramCarousel images={images} />
            </div>
          )}

          <div className="mt-4 border-t border-dashed pt-4">
            <span className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-all duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
              Lihat Detail
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}

function CandidateCarousel({ candidates }: { candidates: CandidateWithImages[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function onScroll() {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.min(index, candidates.length - 1));
  }

  function goTo(index: number) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  }

  return (
    <div className="mt-12">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:snap-none sm:overflow-visible sm:pb-0 lg:grid-cols-3"
      >
        {candidates.map((candidate) => (
          <motion.div
            key={candidate.id}
            {...fadeUp(0.1)}
            className="w-[85%] shrink-0 snap-start sm:w-auto"
          >
            <CandidateCard candidate={candidate} />
          </motion.div>
        ))}
      </div>

      {candidates.length > 1 && (
        <div className="mt-4 flex justify-center gap-2 sm:hidden">
          {candidates.map((candidate, index) => (
            <button
              key={candidate.id}
              type="button"
              aria-label={`Kandidat ${index + 1}`}
              onClick={() => goTo(index)}
              className={`h-2 rounded-full transition-all duration-200 ${
                index === active ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  const { data: elections } = useQuery({
    queryKey: ['elections'],
    queryFn: listElections,
    retry: false,
  });
  const election = elections?.find((e) => e.status === 'ACTIVE') ?? elections?.[0];
  const status: BallotStatus = (election?.status as BallotStatus) ?? 'DRAFT';
  const allElections = elections ?? [];

  const sortedElections = [...allElections].sort((a, b) => (a.order ?? 1) - (b.order ?? 1));

  const candidateQueries = useQueries({
    queries: sortedElections.map((e) => ({
      queryKey: ['public-candidates', e.id],
      queryFn: () => listPublicCandidates(e.id),
      enabled: !!e.id,
      retry: false,
    })),
  });

  const electionSections = sortedElections.map((e, i) => ({
    election: e,
    candidates: candidateQueries[i]?.data ?? [],
  }));

  const heroAnim = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] as const },
      };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <motion.div aria-hidden style={{ y: bgY }} className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, var(--hero-tint), transparent)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
      </motion.div>

      <section className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-24">
        {/* OSIS & MPK photo backdrop — hero only, replace public/osis-mpk-bg.webp to update. Fallback CSS mesh stays underneath. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <Image
            src="/osis-mpk-bg.webp"
            alt=""
            fill
            priority
            className="scale-[1.02] object-cover blur-[3px] opacity-[0.8] dark:opacity-[0.65]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>
        <motion.header
          {...(reduced
            ? {}
            : {
                initial: { opacity: 0, y: -8 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.6, delay: 0.15, ease: [0.21, 0.47, 0.32, 0.98] as const },
              })}
          className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-4 lg:px-8"
        >
          <div className="group flex items-center gap-2.5">
            <motion.div
              {...(reduced
                ? {}
                : {
                    initial: { scale: 0.9, opacity: 0 },
                    animate: { scale: 1, opacity: 1 },
                    transition: { duration: 0.5, delay: 0.25 },
                  })}
              className="flex h-9 w-9 sm:h-16 sm:w-16 items-center justify-center rounded-lg bg-white/80 p-1 shadow-sm backdrop-blur transition-transform duration-200 group-hover:scale-[1.04]"
            >
              <Image
                src="/logo-smansa.png"
                alt="SMA N 1 Wonosobo"
                width={64}
                height={64}
                className="h-7 w-7 object-contain sm:h-14 sm:w-14"
                priority
              />
            </motion.div>
            <motion.span
              {...(reduced
                ? {}
                : {
                    initial: { opacity: 0, x: -6 },
                    animate: { opacity: 1, x: 0 },
                    transition: { duration: 0.5, delay: 0.3 },
                  })}
              className="sm:text-2xl font-heading font-semibold text-gray-100 tracking-tight text-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
            >
              SMA N 1 Wonosobo
            </motion.span>
          </div>
          <div className="flex items-center gap-3">
            <motion.div
              {...(reduced
                ? {}
                : {
                    initial: { opacity: 0, x: 8 },
                    animate: { opacity: 1, x: 0 },
                    transition: { duration: 0.5, delay: 0.35 },
                  })}
            >
              <Image
                src="/logo-osis.png"
                alt="OSIS"
                width={64}
                height={64}
                className="h-8 w-8 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] sm:h-16 sm:w-16"
              />
            </motion.div>
            <motion.div
              {...(reduced
                ? {}
                : {
                    initial: { opacity: 0, x: 8 },
                    animate: { opacity: 1, x: 0 },
                    transition: { duration: 0.5, delay: 0.4 },
                  })}
            >
              <Image
                src="/logo-mpk.png"
                alt="MPK"
                width={64}
                height={64}
                className="h-8 w-8 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] sm:h-16 sm:w-16"
              />
            </motion.div>
          </div>
        </motion.header>
        <motion.p
          {...heroAnim}
          className="font-mono text-xs uppercase tracking-[0.3em] text-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
        >
          <span
            className={
              'inline-flex items-center opacity-70 bg-gray-50 gap-1.5 rounded-full border-2 border-dashed px-3 py-1 text-xs font-semibold tracking-wide'
            }
          >
            Pemilihan Organisasi{election ? ` · ${election.academic_year}` : ''}
          </span>
        </motion.p>

        <motion.h1
          {...heroAnim}
          className="mt-4 text-center font-heading text-4xl font-bold leading-tight text-foreground drop-shadow-[0_1px_8px_rgba(0,0,0,0.12)] sm:text-6xl"
        >
          Pilih Pemimpin Organisasi
        </motion.h1>

        <motion.div {...heroAnim} className="mt-10 w-full max-w-sm">
          <FloatingBallot />
        </motion.div>

        <motion.div {...heroAnim} className="mt-12 text-center">
          <div className="flex justify-center">
            <BallotStamp status={status} />
          </div>
          {allElections.length > 0 && (
            <>
              <h2 className="mt-4 font-heading text-xl font-semibold text-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                {allElections.map((e) => e.title.replace(/^Pemilihan Ketua\s*/, '')).join(' · ')}
              </h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-foreground">
                {allElections.find((e) => e.status === 'ACTIVE')
                  ? 'Sedang berlangsung — pilih pemimpinmu.'
                  : 'Dijadwalkan — pantau perkembangannya.'}
              </p>
              <p className="mt-3 font-mono text-sm text-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
                {allElections.length} pemilihan · {formatPeriod(election!)}
              </p>
            </>
          )}
          <Link
            href="/student/login"
            className="mt-8 inline-flex h-12 w-full max-w-sm items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md"
          >
            Siap Memilih — Klik di Sini
          </Link>
        </motion.div>
      </section>

      {allElections.length > 0 && (
        <section className="relative mx-auto max-w-5xl px-6 py-16">
          <motion.div {...fadeUp()} className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Pilih Pemilihan
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">
              Ikuti Pemilihan yang Tersedia
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Pilih salah satu pemilihan untuk melihat kandidat dan informasi lengkapnya.
            </p>
          </motion.div>

          <div
            className={`mt-12 grid gap-6 ${
              allElections.length > 1 ? 'sm:grid-cols-2' : 'mx-auto max-w-md sm:grid-cols-1'
            }`}
          >
            {allElections.map((electionItem, index) => {
              const itemStatus = electionItem.status as BallotStatus;
              return (
                <motion.div
                  key={electionItem.id}
                  {...fadeUp(index * 0.1)}
                  className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <BallotStamp status={itemStatus} />
                    <span className="font-mono text-xs text-muted-foreground">
                      {electionItem.academic_year}
                    </span>
                  </div>
                  <h3 className="mt-4 font-heading text-xl font-bold">{electionItem.title}</h3>
                  {electionItem.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {electionItem.description}
                    </p>
                  )}
                  <p className="mt-3 font-mono text-xs text-muted-foreground">
                    {formatPeriod(electionItem)}
                  </p>
                  <div className="mt-5 flex gap-2">
                    <Link
                      href="/student/login"
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90"
                    >
                      Siap Memilih
                    </Link>
                    {electionItem.status === 'CLOSED' && (
                      <Link
                        href={`/results/${electionItem.id}`}
                        className="inline-flex h-10 items-center justify-center rounded-lg border-2 border-success/50 bg-success/10 px-4 text-sm font-semibold text-success transition-all duration-200 hover:bg-success/20"
                      >
                        🎉 Hasil
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {electionSections.map(({ election: e, candidates: eCandidates }) =>
        eCandidates.length > 0 ? (
          <section key={e.id} className="relative mx-auto max-w-6xl px-6 py-20">
            <motion.div {...fadeUp()} className="text-center">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Kenali Kandidatmu
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">{e.title}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                Pelajari visi, misi, dan program setiap kandidat sebelum menentukan pilihanmu.
              </p>
            </motion.div>
            <CandidateCarousel candidates={eCandidates} />
          </section>
        ) : null,
      )}

      <section className="relative mx-auto max-w-5xl px-6 py-20">
        <motion.div {...fadeUp()} className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Cara Memilih
          </p>
          <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">Hanya Tiga Langkah</h2>
        </motion.div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Masuk',
              desc: 'Login dengan NIS/NISN dan Token Voting dari panitia.',
            },
            {
              step: '02',
              title: 'Pilih',
              desc: 'Pelajari kandidat, lalu pilih satu yang paling kamu percaya.',
            },
            {
              step: '03',
              title: 'Selesai',
              desc: 'Suaramu tersimpan rahasia. Satu siswa, satu suara.',
            },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              {...fadeUp(index * 0.12)}
              className="rounded-2xl border bg-card p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <p className="font-mono text-sm text-primary">/{item.step}</p>
              <h3 className="mt-3 font-heading text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative px-6 py-24 text-center">
        <motion.div {...fadeUp()}>
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            Suaramu Menentukan Masa Depan
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Gunakan hak pilihmu dengan bijak.
          </p>
          <Link
            href="/student/login"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-10 font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md"
          >
            Siap Memilih — Klik di Sini
          </Link>
        </motion.div>
      </section>

      <footer className="relative border-t bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-8 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-orivastra-white-circle.png"
              alt="Orivastra"
              width={32}
              height={32}
              className="h-7 w-7 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-heading text-sm font-bold tracking-[0.14em] text-foreground">
                ORIV<span className="text-primary">A</span>STRA
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                From Origin to the Stars.
              </span>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-sm text-muted-foreground">
              Built with care by <span className="font-semibold text-foreground">Orivastra</span>
            </p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              © {new Date().getFullYear()} Orivastra
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
