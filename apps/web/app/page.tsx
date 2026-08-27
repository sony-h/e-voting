'use client';

import { useRef, useState } from 'react';
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
import {
  KeyRound,
  LogIn,
  Vote,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Users,
  Quote,
} from 'lucide-react';
import type { CandidateWithImages } from '@/services/candidates';
import { listElections } from '@/services/elections';
import { listPublicCandidates } from '@/services/candidates';
import { formatPeriod } from '@/lib/format';
import { uploadUrl } from '@/lib/images';
import { fadeUp } from '@/lib/animations';
import { BallotStamp, type BallotStatus } from '@/components/ui/ballot-stamp';
import { ImageCarousel } from '@/components/ui/image-carousel';

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
            className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary shadow-xl shadow-primary/20"
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
          className="absolute -right-2 top-6 h-8 w-8 rounded-full bg-success/25"
          style={{ transform: 'translateZ(70px)' }}
        />
        <div
          className="absolute -left-3 bottom-8 h-12 w-12 rounded-full bg-primary/15"
          style={{ transform: 'translateZ(55px)' }}
        />
      </motion.div>
      <div
        aria-hidden
        className="absolute inset-x-8 -bottom-6 h-6 rounded-full bg-primary/20 blur-xl"
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
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-sm backdrop-blur transition-all duration-300 hover:border-primary/40 hover:shadow-xl"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function ProgramCarousel({ images }: { images: CandidateWithImages['images'] }) {
  if (!images || images.length === 0) return null;
  return (
    <div className="mt-2">
      <ImageCarousel
        images={images.map((img) => ({
          id: img.id,
          url: uploadUrl(img.url) ?? '',
          caption: img.caption,
        }))}
        ratio="3/4"
        autoplayMs={5000}
        rounded="lg"
        altFallback="Gambar program"
      />
    </div>
  );
}

function CandidatePhotoCarousel({ candidate }: { candidate: CandidateWithImages }) {
  const photos = (candidate.images ?? []).filter((img) => img.type === 'PHOTO');
  if (photos.length === 0) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center bg-muted text-sm text-muted-foreground">
        No foto
      </div>
    );
  }
  return (
    <ImageCarousel
      images={photos.map((img) => ({ id: img.id, url: uploadUrl(img.url) ?? '' }))}
      ratio="3/4"
      autoplayMs={10000}
      rounded="none"
      altFallback={candidate.chairman_name}
    />
  );
}

function CandidateCard({ candidate }: { candidate: CandidateWithImages }) {
  return (
    <TiltCard>
      <Link href={`/candidate/${candidate.id}`} className="group flex h-full flex-col">
        <div className="relative overflow-hidden">
          <CandidatePhotoCarousel candidate={candidate} />
          <span
            className="absolute left-3.5 top-3.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary font-mono text-base font-bold text-primary-foreground shadow-md backdrop-blur"
            style={{ transform: 'translateZ(30px)' }}
          >
            {candidate.candidate_number}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5" style={{ transform: 'translateZ(20px)' }}>
          <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">
            {candidate.chairman_name}
          </h3>
          <p className="text-sm font-medium text-muted-foreground">
            {candidate.vice_chairman_name ? `& ${candidate.vice_chairman_name}` : '—'}
          </p>

          {candidate.program_description ? (
            <div className="mt-3 rounded-xl border border-primary/10 bg-primary/5 p-3 text-xs italic text-foreground/90">
              <Quote className="inline h-3 w-3 text-primary mr-1 -mt-0.5" />
              <span className="line-clamp-2">&ldquo;{candidate.program_description}&rdquo;</span>
            </div>
          ) : (
            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{candidate.vision}</p>
          )}

          {(candidate.images ?? []).filter((img) => img.type === 'PROGRAM').length > 0 && (
            <div className="mt-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Galeri Program
              </p>
              <ProgramCarousel
                images={(candidate.images ?? []).filter((img) => img.type === 'PROGRAM')}
              />
            </div>
          )}

          <div className="mt-auto pt-5">
            <span className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-semibold text-foreground transition-all duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground shadow-xs">
              Lihat Profil &amp; Visi Misi
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
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
    <div className="mt-10">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className={[
          'flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'sm:grid sm:snap-none sm:overflow-visible sm:pb-0',
          candidates.length === 1
            ? 'sm:grid-cols-1 lg:grid-cols-1 sm:mx-auto sm:max-w-md lg:max-w-md'
            : candidates.length === 2
              ? 'sm:grid-cols-2 lg:grid-cols-2 lg:mx-auto lg:max-w-4xl'
              : 'sm:grid-cols-2 lg:grid-cols-3',
        ].join(' ')}
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

      {/* Hero Section */}
      <section className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <Image
            src="/osis-mpk-bg.webp"
            alt=""
            fill
            priority
            className="scale-[1.02] object-cover blur-[4px] opacity-[0.75] dark:opacity-[0.55]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background" />
        </div>

        {/* Top Header Logos */}
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
              className="flex h-9 w-9 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-white/80 p-1 shadow-sm backdrop-blur transition-transform duration-200 group-hover:scale-[1.04]"
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
              className="sm:text-xl font-heading font-semibold text-gray-100 tracking-tight text-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
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

        {/* Unified Frosted Glass Hero Card */}
        <motion.div
          {...heroAnim}
          className="relative z-10 mx-auto my-auto w-full max-w-3xl rounded-3xl border border-white/20 bg-background/30 p-8 text-center shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-background/40 sm:p-12"
        >
          {/* Hero Eyebrow Pill */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-background/60 px-4 py-1.5 text-xs font-semibold text-foreground shadow-2xs backdrop-blur-sm dark:bg-background/60">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              E-Voting Resmi SMA N 1 Wonosobo{election ? ` · ${election.academic_year}` : ''}
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="mt-6 font-heading text-3xl font-bold leading-tight tracking-tight text-foreground drop-shadow-[0_2px_8px_rgba(0,0,0,0.12)] sm:text-5xl lg:text-6xl">
            Satu Suara, Menentukan Arah Pemimpin Masa Depan
          </h1>

          {/* Inclusive Subtitle */}
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-foreground/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.1)] sm:text-base">
            Portal pemilihan terpadu Ketua OSIS &amp; Ketua MPK untuk seluruh Siswa, Guru, dan
            Tenaga Kependidikan secara langsung, umum, bebas, dan rahasia.
          </p>

          {/* 3D Floating Ballot */}
          <div className="mt-8">
            <FloatingBallot />
          </div>

          {/* Status & Action Buttons */}
          <div className="mt-8">
            <div className="flex justify-center">
              <BallotStamp status={status} />
            </div>

            {allElections.length > 0 && (
              <div className="mt-4">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  {allElections.map((e) => e.title.replace(/^Pemilihan Ketua\s*/, '')).join(' · ')}
                </h2>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {allElections.length} Pemilihan Aktif · {formatPeriod(election!)}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/student/login"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-8 font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg"
              >
                Masuk Portal Pemilihan
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#elections"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-background/80 px-6 text-sm font-semibold text-foreground shadow-xs transition-all duration-200 hover:bg-accent"
              >
                Lihat Pemilihan
                <ChevronDown className="h-4 w-4" />
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Section 1: Available Elections Cards */}
      {allElections.length > 0 && (
        <section id="elections" className="relative mx-auto max-w-5xl px-6 py-20">
          <motion.div {...fadeUp()} className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground flex items-center justify-center gap-1.5">
              <Vote className="h-3.5 w-3.5 text-primary" /> PILIHAN PEMILIHAN
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">
              Ikuti Pemilihan yang Tersedia
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Pilih salah satu pemilihan di bawah untuk meninjau profil kandidat dan informasi
              lengkapnya.
            </p>
          </motion.div>

          <div
            className={`mt-12 grid gap-6 ${
              allElections.length > 1 ? 'sm:grid-cols-2' : 'mx-auto max-w-md sm:grid-cols-1'
            }`}
          >
            {allElections.map((electionItem, index) => {
              const itemStatus = electionItem.status as BallotStatus;
              const matchingCandidates =
                electionSections.find((s) => s.election.id === electionItem.id)?.candidates ?? [];

              return (
                <motion.div
                  key={electionItem.id}
                  {...fadeUp(index * 0.1)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card/80 p-7 shadow-xs backdrop-blur transition-all duration-300 hover:border-primary/40 hover:shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <BallotStamp status={itemStatus} />
                      <span className="font-mono text-xs rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                        {electionItem.academic_year}
                      </span>
                    </div>

                    <h3 className="mt-5 font-heading text-2xl font-bold tracking-tight text-foreground">
                      {electionItem.title}
                    </h3>

                    {electionItem.description && (
                      <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {electionItem.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Users className="h-4 w-4 text-primary" />
                      <span>
                        {matchingCandidates.length > 0
                          ? `${matchingCandidates.length} Pasangan Calon Terdaftar`
                          : 'Kandidat siap dipilih'}
                      </span>
                    </div>

                    <p className="mt-3 font-mono text-xs text-muted-foreground/80">
                      {formatPeriod(electionItem)}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2.5 border-t border-dashed pt-5">
                    <Link
                      href="/student/login"
                      className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-xs transition-all duration-200 hover:bg-primary/90"
                    >
                      Siap Memilih
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <a
                      href={`#candidate-section-${electionItem.id}`}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-accent"
                    >
                      Lihat Kandidat
                    </a>
                    {electionItem.status === 'CLOSED' && (
                      <Link
                        href={`/results/${electionItem.id}`}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-success/40 bg-success/10 px-4 text-sm font-semibold text-success transition-all duration-200 hover:bg-success/20"
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

      {/* Section 2: Candidate Showcases */}
      {electionSections.map(({ election: e, candidates: eCandidates }) =>
        eCandidates.length > 0 ? (
          <section
            key={e.id}
            id={`candidate-section-${e.id}`}
            className="relative mx-auto max-w-6xl px-6 py-20 scroll-mt-12"
          >
            <motion.div {...fadeUp()} className="text-center">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground flex items-center justify-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> KENALI KANDIDATMU
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">{e.title}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                Pelajari visi, misi, dan gagasan setiap kandidat sebelum menentukan pilihan
                terbaikmu.
              </p>
            </motion.div>
            <CandidateCarousel candidates={eCandidates} />
          </section>
        ) : null,
      )}

      {/* Section 3: 4-Step Timeline Guide */}
      <section className="relative mx-auto max-w-6xl px-6 py-24">
        <motion.div {...fadeUp()} className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground flex items-center justify-center gap-1.5">
            <Vote className="h-3.5 w-3.5 text-primary" /> ALUR &amp; PANDUAN MEMILIH
          </p>
          <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">
            Empat Langkah Mudah Menyalurkan Hak Suara
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Proses pemilihan digital yang cepat, transparan, dan terjamin kerahasiaannya untuk
            Siswa, Guru, dan Tenaga Kependidikan.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: '01',
              icon: KeyRound,
              title: 'Dapatkan Token',
              desc: 'Panitia menerbitkan token voting 8-karakter (XXXX-XXXX) yang berlaku 24 jam untuk setiap pemilih terdaftar.',
            },
            {
              step: '02',
              icon: LogIn,
              title: 'Masuk ke Portal',
              desc: 'Siswa masuk dengan NIS/NISN, sedangkan Guru & Staf masuk menggunakan NIP atau Username beserta token voting.',
            },
            {
              step: '03',
              icon: Vote,
              title: 'Tentukan Pilihan',
              desc: 'Pilih pasangan calon Ketua OSIS & Ketua MPK secara berurutan dalam satu sesi pemilihan yang nyaman.',
            },
            {
              step: '04',
              icon: ShieldCheck,
              title: 'Suara Terverifikasi',
              desc: 'Suara tersimpan secara anonim dan terenkripsi ke sistem rekapitulasi real-time. Satu pemilih, satu suara sah.',
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                {...fadeUp(index * 0.1)}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card/70 p-6 shadow-xs backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-sm font-bold text-muted-foreground/60 group-hover:text-primary transition-colors">
                      /{item.step}
                    </span>
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Section 4: Final Call to Action */}
      <section className="relative px-6 py-24 text-center">
        <motion.div
          {...fadeUp()}
          className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card to-background p-10 sm:p-14 shadow-lg"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background: 'radial-gradient(circle at 50% 0%, var(--primary), transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Bersama Sukseskan Pemilu Sekolah
            </span>
            <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Waktunya Bersuara untuk Sekolah Kita
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Pastikan token voting Anda telah siap dan gunakan hak pilih Anda sebelum batas waktu
              pemilihan berakhir.
            </p>
            <Link
              href="/student/login"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-10 font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-xl"
            >
              Mulai Memilih Sekarang
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
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
