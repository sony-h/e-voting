'use client';

import { useState } from 'react';
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

export default function AdminResultsPage() {
  const queryClient = useQueryClient();
  const [electionId, setElectionId] = useState('');

  const { data: elections } = useQuery({ queryKey: ['elections'], queryFn: listElections });
  const effectiveElectionId = electionId || elections?.[0]?.id || '';
  const selectedElection = elections?.find((e) => e.id === effectiveElectionId);

  const {
    data: results,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['results', effectiveElectionId],
    queryFn: () => getResults(effectiveElectionId),
    enabled: !!effectiveElectionId,
    retry: false,
  });

  const notClosed =
    isError && selectedElection?.status !== 'CLOSED' && selectedElection?.status !== undefined;

  const publishMutation = useMutation({
    mutationFn: (visible: boolean) => publishResults(effectiveElectionId, visible),
    onSuccess: async (_, visible) => {
      await queryClient.invalidateQueries({ queryKey: ['results', effectiveElectionId] });
      toast.success(visible ? 'Hasil ditampilkan ke publik.' : 'Hasil disembunyikan dari publik.');
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
        title="Results"
        description="Hasil pemilihan hanya tersedia setelah election ditutup."
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
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    published ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {published ? 'Ditampilkan ke publik' : 'Tersembunyi dari publik'}
                </span>
                <Button
                  onClick={() => publishMutation.mutate(!published)}
                  disabled={publishMutation.isPending}
                >
                  {published ? 'Sembunyikan Hasil' : 'Tampilkan Hasil ke Publik'}
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
