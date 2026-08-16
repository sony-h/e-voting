'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listElections } from '@/services/elections';
import { ApiError } from '@/lib/api';
import { exportResultsExcel, exportResultsPdf, getResults } from '@/services/results';
import { ElectionSelect } from '@/components/admin/election-select';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Toaster } from '@/components/ui/sonner';

export default function AdminResultsPage() {
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

  const maxVotes = Math.max(...(results?.candidates.map((c) => c.votes) ?? [0]), 1);
  const winner = results?.candidates[0];

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
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-6 shadow-sm">
            <div>
              <h2 className="font-heading text-lg font-bold">{results.election.title}</h2>
              <p className="text-sm text-muted-foreground">
                Tahun Ajaran {results.election.academic_year} · Total Suara:{' '}
                <span className="font-mono">{results.total_votes}</span>
              </p>
            </div>
            {winner && results.total_votes > 0 && (
              <div className="rounded-xl border border-success/40 bg-success/10 px-5 py-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-success">
                  Pemenang
                </p>
                <p className="font-heading text-lg font-bold">{winner.chairman_name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {winner.votes} suara ({winner.percentage}%)
                </p>
              </div>
            )}
          </div>

          {results.total_votes === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              Belum ada suara.
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Peringkat</TableHead>
                      <TableHead>No Urut</TableHead>
                      <TableHead>Kandidat</TableHead>
                      <TableHead>Suara</TableHead>
                      <TableHead>Persentase</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.candidates.map((c, i) => (
                      <TableRow key={c.candidateNumber}>
                        <TableCell className="font-medium">
                          {i === 0 ? (
                            <span className="rounded-full bg-success px-2 py-0.5 text-xs font-semibold text-white">
                              #1
                            </span>
                          ) : (
                            `#${i + 1}`
                          )}
                        </TableCell>
                        <TableCell className="font-mono">{c.candidateNumber}</TableCell>
                        <TableCell className="font-heading font-semibold">
                          {c.chairman_name}
                          {c.vice_chairman_name ? (
                            <span className="text-muted-foreground"> & {c.vice_chairman_name}</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="font-mono">{c.votes}</TableCell>
                        <TableCell className="font-mono">{c.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="font-heading font-semibold">Grafik Suara</h2>
                <div className="mt-4 space-y-3">
                  {results.candidates.map((c, i) => (
                    <div key={c.candidateNumber} className="flex items-center gap-3">
                      <span className="w-8 shrink-0 text-right font-mono text-sm font-medium">
                        {c.candidateNumber}
                      </span>
                      <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
                        <div
                          className={`flex h-full items-center rounded-md pl-2 text-xs font-medium text-white transition-all duration-200 ${
                            i === 0 ? 'bg-success' : 'bg-primary'
                          }`}
                          style={{ width: `${(c.votes / maxVotes) * 100}%` }}
                        >
                          <span className="font-mono">{c.votes}</span>
                        </div>
                      </div>
                      <span className="w-12 shrink-0 font-mono text-sm text-muted-foreground">
                        {c.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <Toaster />
    </div>
  );
}
