'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listElections } from '@/services/elections';
import { ApiError } from '@/lib/api';
import {
  exportResultsExcel,
  exportResultsPdf,
  getResults,
  publishResults,
} from '@/services/results';
import { ElectionSelect } from '@/components/admin/election-select';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { FestiveResults, FireConfetti } from '@/components/results/festive-results';
import { Toaster } from '@/components/ui/sonner';

const REVEAL_DELAY_MS = 15000;

export default function AdminResultsPage() {
  const queryClient = useQueryClient();
  const [electionId, setElectionId] = useState('');
  const [revealing, setRevealing] = useState(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, []);

  const { data: elections } = useQuery({ queryKey: ['elections'], queryFn: listElections });
  const effectiveElectionId = electionId || elections?.[0]?.id || '';
  const selectedElection = elections?.find((e) => e.id === effectiveElectionId);

  const {
    data: results,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['results', effectiveElectionId],
    queryFn: () => getResults(effectiveElectionId),
    enabled: !!effectiveElectionId,
    retry: false,
  });

  const errorCode = error instanceof ApiError ? error.errorCode : null;
  const notClosed =
    isError && selectedElection?.status !== 'CLOSED' && selectedElection?.status !== undefined;
  const notPublished =
    isError && errorCode === 'RESULTS_NOT_PUBLISHED' && selectedElection?.status === 'CLOSED';

  const publishMutation = useMutation({
    mutationFn: (visible: boolean) => publishResults(effectiveElectionId, visible),
    onSuccess: async (_, visible) => {
      if (visible) {
        setRevealing(true);
        toast.success('Hasil ditampilkan ke publik.');
        revealTimer.current = setTimeout(async () => {
          await queryClient.invalidateQueries({ queryKey: ['results', effectiveElectionId] });
          setRevealing(false);
        }, REVEAL_DELAY_MS);
      } else {
        if (revealTimer.current) clearTimeout(revealTimer.current);
        await queryClient.invalidateQueries({ queryKey: ['results', effectiveElectionId] });
        toast.success('Hasil disembunyikan dari publik.');
      }
    },
    onError: () => toast.error('Gagal mengubah status publikasi.'),
  });

  async function handleExport(kind: 'pdf' | 'excel') {
    try {
      if (kind === 'pdf') await exportResultsPdf(effectiveElectionId);
      else await exportResultsExcel(effectiveElectionId);
      toast.success(`Export ${kind.toUpperCase()} berhasil.`);
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'ELECTION_NOT_CLOSED') {
        toast.error('Hasil hanya tersedia setelah election ditutup.');
      } else {
        toast.error('Gagal melakukan export.');
      }
    }
  }

  const published = results?.election.results_public ?? false;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Orivastra · Hasil"
        title="Hasil"
        description="Hasil pemilihan hanya tersedia setelah pemilihan ditutup."
        action={
          <div className="flex flex-wrap items-end gap-4">
            <ElectionSelect value={effectiveElectionId} onChange={setElectionId} />
            <Button
              variant="outline"
              onClick={() => handleExport('pdf')}
              disabled={!effectiveElectionId || !results}
            >
              Export PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('excel')}
              disabled={!effectiveElectionId || !results}
            >
              Export Excel
            </Button>
          </div>
        }
      />

      {!effectiveElectionId ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Belum ada election.
        </div>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat...</p>
      ) : notClosed ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Hasil hanya tersedia setelah election ditutup.
        </div>
      ) : notPublished ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center shadow-sm">
          {revealing ? (
            <>
              <p className="text-4xl animate-pulse">🎉</p>
              <h2 className="mt-3 font-heading text-2xl font-bold">
                Menampilkan hasil ke publik...
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Halaman publik sedang memuat hasil. Hasil akan tampil di sini sebentar lagi.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
              </div>
            </>
          ) : (
            <>
              <p className="text-4xl">🔒</p>
              <h2 className="mt-3 font-heading text-2xl font-bold">Hasil tersembunyi</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Hasil belum ditampilkan ke publik. Klik tombol di bawah untuk menampilkan hasil —
                baik di halaman admin maupun halaman publik secara bersamaan.
              </p>
              <Button
                className="mt-6"
                onClick={() => publishMutation.mutate(true)}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending ? 'Menampilkan...' : 'Tampilkan Hasil ke Publik 🎉'}
              </Button>
            </>
          )}
        </div>
      ) : !results ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Hasil tidak dapat dimuat.
        </div>
      ) : (
        <>
          {published && <FireConfetti />}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-lg font-bold">{results.election.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Tahun Ajaran {results.election.academic_year} · Total Suara:{' '}
                  <span className="font-mono">{results.total_votes}</span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                  Ditampilkan ke publik
                </span>
                <Button
                  variant="outline"
                  onClick={() => publishMutation.mutate(false)}
                  disabled={publishMutation.isPending}
                >
                  Sembunyikan Hasil
                </Button>
              </div>
            </div>
          </div>

          <FestiveResults results={results} />
        </>
      )}

      <Toaster />
    </div>
  );
}
