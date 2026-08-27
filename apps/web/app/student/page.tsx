'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  Sparkles,
  User,
  LogOut,
  Eye,
  Vote,
  ShieldCheck,
  Target,
  Quote,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { Candidate, CandidateImage } from '@e-voting/types';
import { API_BASE_URL, ApiError } from '@/lib/api';
import { getVotingCandidates, getVotingStatus, submitVote } from '@/services/voting';
import { studentLogout, studentSession } from '@/services/auth';
import { fadeUp } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { ImageCarousel } from '@/components/ui/image-carousel';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const UPLOADS_BASE = API_BASE_URL.replace('/api/v1', '');

function toCarouselImages(images: CandidateImage[]) {
  return images.map((img) => ({
    id: img.id,
    url: `${UPLOADS_BASE}${img.url}`,
    caption: img.caption,
  }));
}

function CheckIcon() {
  return (
    <div className="mx-auto flex h-20 w-20 animate-[check-pop_0.4s_ease-out] items-center justify-center rounded-full bg-success/15 shadow-md">
      <CheckCircle2 className="h-10 w-10 text-success" />
    </div>
  );
}

function SessionTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setRemaining(Math.max(0, diff));
      if (diff <= 0) onExpire();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const totalSeconds = Math.ceil(remaining / 1000);
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  const low = remaining < 60_000;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs shadow-2xs backdrop-blur-sm ${
        low
          ? 'animate-pulse border-destructive/40 bg-destructive/10 text-destructive'
          : 'border-border/70 bg-background/80 text-muted-foreground'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${low ? 'bg-destructive' : 'bg-primary'}`} />
      <span>
        Sisa waktu {mm}:{ss}
      </span>
    </span>
  );
}

export default function StudentPortalPage() {
  const router = useRouter();
  const [voted, setVoted] = useState(false);
  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null);
  const [confirmCandidate, setConfirmCandidate] = useState<Candidate | null>(null);
  const [nextElection, setNextElection] = useState<{ electionId: string } | null>(null);
  const [countdown, setCountdown] = useState(5);
  const queryClient = useQueryClient();

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['voting-status'],
    queryFn: getVotingStatus,
    retry: false,
  });

  const currentElection = status?.elections?.find((e) => !e.has_voted);
  const statusError = !statusLoading && !status;

  const { data: session } = useQuery({
    queryKey: ['student-session'],
    queryFn: studentSession,
    retry: false,
  });

  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: ['voting-candidates', currentElection?.electionId],
    queryFn: getVotingCandidates,
    retry: false,
    enabled: !!status && !!currentElection,
  });

  async function handleSessionExpire() {
    await studentLogout().catch(() => undefined);
    router.push('/student/login?expired=1');
  }

  const goToNext = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['voting-status'] });
    setVoted(false);
    setNextElection(null);
    setCountdown(5);
  }, [queryClient]);

  const submitMutation = useMutation({
    mutationFn: (candidateId: string) => submitVote(candidateId),
    onSuccess: (result) => {
      setNextElection(result.next);
      setVoted(true);
      setConfirmCandidate(null);
      setDetailCandidate(null);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.errorCode === 'ALREADY_VOTED') {
        setVoted(true);
        setConfirmCandidate(null);
      } else {
        toast.error('Gagal mengirim suara. Silakan coba lagi.');
      }
    },
  });

  useEffect(() => {
    if (!voted) return;
    let remaining = 5;
    const timer = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        if (nextElection) {
          goToNext();
        } else {
          router.push('/');
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [voted, router, nextElection, goToNext]);

  async function handleLogout() {
    await studentLogout().catch(() => undefined);
    router.push('/');
  }

  if (voted || statusError) {
    return (
      <main className="relative flex min-h-screen items-center justify-center px-6 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -10%, var(--hero-tint), transparent)',
            }}
          />
        </div>
        <div className="w-full max-w-md text-center rounded-3xl border border-border/80 bg-card/85 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          <CheckIcon />
          <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-foreground">
            {nextElection ? 'Suara Berhasil Terkirim!' : 'Terima Kasih Atas Partisipasimu!'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {nextElection
              ? 'Pilihan Anda untuk sesi ini telah tercatat secara rahasia. Siap melanjutkan ke pemilihan berikutnya.'
              : 'Seluruh hak suara Anda telah disalurkan dengan aman dan terverifikasi di sistem rekapitulasi.'}
          </p>
          {voted && (
            <div className="mt-4 rounded-xl bg-muted/60 px-4 py-2 font-mono text-xs text-muted-foreground">
              Mengalihkan ke {nextElection ? 'pemilihan berikutnya' : 'beranda'} dalam{' '}
              <span className="font-bold text-foreground">{countdown}</span> detik...
            </div>
          )}
          <div className="mt-6 flex flex-col gap-3">
            {nextElection && (
              <button
                onClick={goToNext}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg"
              >
                <span>Lanjut ke Pemilihan Berikutnya</span>
                <Vote className="h-4 w-4" />
              </button>
            )}
            <Link
              href="/"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-background px-6 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-accent"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (statusLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-3 font-mono text-xs text-muted-foreground">Memuat bilik suara...</p>
        </div>
      </main>
    );
  }

  if (status?.election_status !== 'ACTIVE') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card/85 p-8 shadow-2xl backdrop-blur-xl">
          <AlertTriangle className="mx-auto h-12 w-12 text-warning" />
          <h1 className="mt-4 font-heading text-2xl font-bold">Pemilihan Belum Dibuka</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sesi pemilihan ini belum aktif. Silakan kembali saat panitia telah memulai voting.
          </p>
          <Button variant="outline" className="mt-6 rounded-xl" onClick={handleLogout}>
            Keluar ke Beranda
          </Button>
        </div>
      </main>
    );
  }

  // Dynamic centering grid class based on candidates count
  const candidateCount = candidates?.length ?? 0;
  const gridContainerClass =
    candidateCount === 1
      ? 'mx-auto max-w-md grid grid-cols-1 gap-6'
      : candidateCount === 2
        ? 'mx-auto max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center'
        : candidateCount === 3
          ? 'mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center'
          : 'mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-center';

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      {/* Ambient background mesh */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
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
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Top Voter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/75 px-5 py-3.5 shadow-xs backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold leading-tight text-foreground">
                {session?.full_name ?? 'Pemilih Terdaftar'}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {session?.role_title ?? 'Hak Suara Aktif'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {session?.expiresAt && (
              <SessionTimer expiresAt={session.expiresAt} onExpire={handleSessionExpire} />
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Keluar"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Section Heading */}
        <div className="mt-10 text-center">
          <motion.div {...fadeUp()}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Bilik Suara Digital
            </span>
          </motion.div>
          <motion.h1
            {...fadeUp(0.05)}
            className="mt-3 font-heading text-2xl sm:text-4xl font-bold tracking-tight text-foreground"
          >
            {currentElection?.title ?? 'Pilih Pasangan Pemimpinmu'}
          </motion.h1>
          <motion.p
            {...fadeUp(0.1)}
            className="mx-auto mt-2 max-w-xl text-xs sm:text-sm leading-relaxed text-muted-foreground"
          >
            Tinjau visi &amp; misi tiap kandidat dengan tombol <strong>Detail</strong>, lalu klik{' '}
            <strong>Pilih</strong> untuk menyalurkan hak suara Anda.
          </motion.p>
        </div>

        {/* Candidate Cards Grid */}
        {candidatesLoading ? (
          <div className="mt-16 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-3 font-mono text-xs text-muted-foreground">Memuat data kandidat...</p>
          </div>
        ) : !candidates || candidates.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed bg-card/50 p-12 text-center text-sm text-muted-foreground">
            Belum ada kandidat pada pemilihan ini.
          </div>
        ) : (
          <div className={`mt-10 ${gridContainerClass}`}>
            {candidates.map((candidate, index) => {
              const photos = (candidate.images ?? []).filter((img) => img.type === 'PHOTO');
              return (
                <motion.div
                  key={candidate.id}
                  {...fadeUp(index * 0.08)}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/85 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
                >
                  <div className="relative">
                    {photos.length === 0 ? (
                      <div className="flex aspect-[3/4] w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                        No foto
                      </div>
                    ) : (
                      <ImageCarousel
                        images={toCarouselImages(photos)}
                        ratio="3/4"
                        autoplayMs={10000}
                        altFallback={candidate.chairman_name}
                      />
                    )}
                    <span className="absolute left-3.5 top-3.5 z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary font-mono text-lg font-bold text-primary-foreground shadow-md backdrop-blur">
                      {candidate.candidate_number}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                      {candidate.chairman_name}
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground">
                      {candidate.vice_chairman_name ? `& ${candidate.vice_chairman_name}` : '—'}
                    </p>

                    {candidate.program_description ? (
                      <div className="mt-3 rounded-xl border border-primary/10 bg-primary/5 p-3 text-xs italic text-foreground/90">
                        <Quote className="inline h-3 w-3 text-primary mr-1 -mt-0.5" />
                        <span className="line-clamp-2">
                          &ldquo;{candidate.program_description}&rdquo;
                        </span>
                      </div>
                    ) : (
                      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {candidate.vision}
                      </p>
                    )}

                    <div className="mt-auto pt-5 border-t border-dashed">
                      <div className="flex gap-2.5">
                        <Button
                          variant="outline"
                          className="flex-1 h-10 gap-1.5 rounded-xl border-border hover:bg-accent"
                          onClick={() => setDetailCandidate(candidate)}
                        >
                          <Eye className="h-4 w-4" />
                          <span>Detail</span>
                        </Button>
                        <Button
                          className="flex-1 h-10 gap-1.5 rounded-xl bg-primary font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 hover:shadow-md"
                          onClick={() => setConfirmCandidate(candidate)}
                        >
                          <Vote className="h-4 w-4" />
                          <span>Pilih</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Security & Confidentiality Footer */}
        <div className="mt-14 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-success shrink-0" />
          <span>
            Suara Anda dienkripsi secara anonim dan dijamin kerahasiaannya oleh sistem Orivastra.
          </span>
        </div>
      </div>

      {/* Wide Editorial Candidate Detail Dialog */}
      <Dialog
        open={detailCandidate !== null}
        onOpenChange={(open) => !open && setDetailCandidate(null)}
      >
        <DialogContent className="sm:max-w-2xl lg:max-w-3xl max-h-[88vh] overflow-y-auto rounded-3xl p-6 sm:p-8 bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl">
          {detailCandidate && (
            <div className="space-y-8">
              {/* Header */}
              <DialogHeader className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Kandidat Nomor {detailCandidate.candidate_number}
                  </span>
                </div>
                <DialogTitle className="mt-2 font-heading text-2xl sm:text-3xl font-bold leading-tight">
                  {detailCandidate.chairman_name}
                  {detailCandidate.vice_chairman_name && (
                    <>
                      {' '}
                      <span className="text-muted-foreground font-normal">&amp;</span>{' '}
                      {detailCandidate.vice_chairman_name}
                    </>
                  )}
                </DialogTitle>
              </DialogHeader>

              {/* Photo Carousel */}
              {(() => {
                const photos = (detailCandidate.images ?? []).filter((img) => img.type === 'PHOTO');
                if (photos.length === 0) return null;
                return (
                  <div className="mx-auto max-w-sm">
                    <ImageCarousel
                      images={toCarouselImages(photos)}
                      ratio="3/4"
                      altFallback={detailCandidate.chairman_name}
                    />
                  </div>
                );
              })()}

              {/* Quote / Kata Mereka */}
              {detailCandidate.program_description && (
                <div className="relative rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center shadow-2xs">
                  <Quote className="mx-auto h-6 w-6 text-primary/30" />
                  <p className="mt-2 font-heading text-base sm:text-lg italic leading-relaxed text-foreground">
                    &ldquo;{detailCandidate.program_description}&rdquo;
                  </p>
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    — {detailCandidate.chairman_name}
                    {detailCandidate.vice_chairman_name
                      ? ` & ${detailCandidate.vice_chairman_name}`
                      : ''}
                  </p>
                </div>
              )}

              {/* Vertically Stacked Visi & Misi */}
              <div className="space-y-4">
                <div className="rounded-2xl border bg-background/60 p-5 sm:p-6 shadow-2xs">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <Target className="h-4 w-4" /> Visi Utama
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                    {detailCandidate.vision}
                  </p>
                </div>

                <div className="rounded-2xl border bg-background/60 p-5 sm:p-6 shadow-2xs">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <Sparkles className="h-4 w-4" /> Misi &amp; Program Kerja
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                    {detailCandidate.mission}
                  </p>
                </div>
              </div>

              {/* Poster Kampanye */}
              {(() => {
                const posters = (detailCandidate.images ?? []).filter(
                  (img) => img.type === 'POSTER',
                );
                if (posters.length === 0) return null;
                return (
                  <div>
                    <div className="text-center">
                      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-primary" /> Poster Kampanye
                      </p>
                    </div>
                    <div className="mx-auto mt-4 max-w-sm">
                      <ImageCarousel
                        images={toCarouselImages(posters)}
                        ratio="2/3"
                        altFallback="Poster kampanye"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Program & Kegiatan Gallery */}
              {(() => {
                const program = (detailCandidate.images ?? []).filter(
                  (img) => img.type === 'PROGRAM',
                );
                if (program.length === 0) return null;
                return (
                  <div>
                    <div className="text-center">
                      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" /> Galeri Program &amp;
                        Kegiatan
                      </p>
                    </div>
                    <div className="mt-4">
                      <ImageCarousel
                        images={toCarouselImages(program)}
                        ratio="3/4"
                        autoplayMs={5000}
                        altFallback="Gambar program"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2.5 pt-4 border-t">
            <Button
              variant="outline"
              className="rounded-xl h-11 px-5"
              onClick={() => setDetailCandidate(null)}
            >
              Tutup
            </Button>
            <Button
              className="rounded-xl h-11 gap-2 bg-primary px-6 font-semibold text-primary-foreground shadow-md hover:bg-primary/90"
              onClick={() => {
                setConfirmCandidate(detailCandidate);
                setDetailCandidate(null);
              }}
            >
              <Vote className="h-4 w-4" />
              <span>Pilih Kandidat Ini</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vote Confirmation Alert Dialog */}
      <AlertDialog
        open={confirmCandidate !== null}
        onOpenChange={(open) => !open && setConfirmCandidate(null)}
      >
        <AlertDialogContent className="sm:max-w-md rounded-3xl border border-border/80 bg-card/95 p-7 sm:p-9 shadow-2xl backdrop-blur-xl">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
              <Vote className="h-7 w-7" />
            </div>
            <AlertDialogTitle className="font-heading text-2xl font-bold">
              Konfirmasi Pilihan Suara
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Apakah Anda yakin ingin memberikan suara untuk kandidat berikut? Pilihan bersifat
              final dan tidak dapat diubah.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmCandidate && (
            <div className="rounded-2xl border border-border/80 bg-background/80 p-5 text-center shadow-xs">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-mono text-lg font-bold text-primary-foreground shadow-2xs">
                {confirmCandidate.candidate_number}
              </span>
              <h3 className="mt-3 font-heading text-lg font-bold text-foreground">
                {confirmCandidate.chairman_name}
              </h3>
              {confirmCandidate.vice_chairman_name && (
                <p className="text-sm font-medium text-muted-foreground">
                  &amp; {confirmCandidate.vice_chairman_name}
                </p>
              )}
            </div>
          )}

          <AlertDialogFooter className="mt-4 flex flex-col-reverse sm:flex-row gap-2.5">
            <AlertDialogCancel className="rounded-xl h-11">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmCandidate && submitMutation.mutate(confirmCandidate.id)}
              disabled={submitMutation.isPending}
              className="rounded-xl h-11 gap-2 bg-primary font-semibold text-primary-foreground shadow-md hover:bg-primary/90"
            >
              {submitMutation.isPending ? (
                <span>Mengirim Suara...</span>
              ) : (
                <>
                  <span>Ya, Kirim Suara Sekarang</span>
                  <Vote className="h-4 w-4" />
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </main>
  );
}
