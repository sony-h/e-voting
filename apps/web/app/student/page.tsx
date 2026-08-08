'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { Candidate } from '@e-voting/types';
import { API_BASE_URL, ApiError } from '@/lib/api';
import { getVotingCandidates, getVotingStatus, submitVote } from '@/services/voting';
import { studentLogout } from '@/services/auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

function photoUrl(candidate: Candidate) {
  return `${UPLOADS_BASE}${candidate.photo_url}`;
}

function CheckIcon() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
      <svg
        className="h-8 w-8 text-green-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

export default function StudentPortalPage() {
  const router = useRouter();
  const [voted, setVoted] = useState(false);
  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null);
  const [confirmCandidate, setConfirmCandidate] = useState<Candidate | null>(null);

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['voting-status'],
    queryFn: getVotingStatus,
    retry: false,
  });

  const statusError = !statusLoading && !status;

  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: ['voting-candidates'],
    queryFn: getVotingCandidates,
    retry: false,
    enabled: !!status,
  });

  const submitMutation = useMutation({
    mutationFn: (candidateId: string) => submitVote(candidateId),
    onSuccess: () => {
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

  async function handleLogout() {
    await studentLogout().catch(() => undefined);
    router.push('/');
  }

  if (voted || statusError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <CheckIcon />
          <h1 className="mt-6 text-2xl font-bold">Terima kasih!</h1>
          <p className="mt-2 text-muted-foreground">Hak pilih Anda telah digunakan.</p>
          <Link
            href="/"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-6 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    );
  }

  if (statusLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Memuat...</p>
      </main>
    );
  }

  if (status?.election_status !== 'ACTIVE') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold">Pemilihan belum dimulai</h1>
          <p className="mt-2 text-muted-foreground">
            Pemilihan akan segera dibuka. Nantikan informasi berikutnya.
          </p>
          <Button variant="outline" className="mt-8" onClick={handleLogout}>
            Keluar
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pilih Pemimpinmu</h1>
            <p className="text-sm text-muted-foreground">
              Pilih satu kandidat. Suara Anda rahasia.
            </p>
          </div>
          <button onClick={handleLogout} className="text-sm text-blue-600 underline">
            Keluar
          </button>
        </div>

        {candidatesLoading ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">Memuat kandidat...</p>
        ) : !candidates || candidates.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Belum ada kandidat.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="flex flex-col overflow-hidden rounded-2xl border bg-card"
              >
                <div className="relative">
                  {candidate.photo_url ? (
                    <Image
                      src={photoUrl(candidate)}
                      alt={candidate.chairman_name}
                      width={320}
                      height={200}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                      No foto
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    Nomor {candidate.candidate_number}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="text-lg font-bold">{candidate.chairman_name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {candidate.vice_chairman_name ?? '—'}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {candidate.vision}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setDetailCandidate(candidate)}
                    >
                      Detail
                    </Button>
                    <Button className="flex-1" onClick={() => setConfirmCandidate(candidate)}>
                      Pilih
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={detailCandidate !== null}
        onOpenChange={(open) => !open && setDetailCandidate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {detailCandidate ? `Nomor ${detailCandidate.candidate_number}` : ''}
            </DialogTitle>
            <DialogDescription>
              {detailCandidate
                ? `${detailCandidate.chairman_name} & ${detailCandidate.vice_chairman_name ?? '—'}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {detailCandidate && (
            <div className="space-y-4">
              {detailCandidate.photo_url ? (
                <Image
                  src={photoUrl(detailCandidate)}
                  alt={detailCandidate.chairman_name}
                  width={320}
                  height={200}
                  className="h-44 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-44 w-full items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
                  No foto
                </div>
              )}
              <div>
                <h3 className="font-semibold">Visi</h3>
                <p className="mt-1 text-sm text-muted-foreground">{detailCandidate.vision}</p>
              </div>
              <div>
                <h3 className="font-semibold">Misi</h3>
                <p className="mt-1 text-sm text-muted-foreground">{detailCandidate.mission}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailCandidate(null)}>
              Tutup
            </Button>
            <Button
              onClick={() => {
                setConfirmCandidate(detailCandidate);
                setDetailCandidate(null);
              }}
            >
              Pilih
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmCandidate !== null}
        onOpenChange={(open) => !open && setConfirmCandidate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin memilih kandidat ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCandidate
                ? `Anda akan memilih "${confirmCandidate.chairman_name}" (Nomor ${confirmCandidate.candidate_number}). Pilihan tidak dapat diubah setelah dikirim.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Kembali</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmCandidate && submitMutation.mutate(confirmCandidate.id)}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Mengirim...' : 'Ya'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </main>
  );
}
