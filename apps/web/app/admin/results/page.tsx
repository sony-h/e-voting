'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listElections } from '@/services/elections';
import { ApiError } from '@/lib/api';
import { exportResultsExcel, exportResultsPdf, getResults } from '@/services/results';
import { ElectionSelect } from '@/components/admin/election-select';
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Results</h1>
          <p className="text-sm text-muted-foreground">
            Hasil pemilihan hanya tersedia setelah election ditutup.
          </p>
        </div>
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
      </div>

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
          <div className="rounded-xl border p-6">
            <h2 className="text-lg font-bold">{results.election.title}</h2>
            <p className="text-sm text-muted-foreground">
              Tahun Ajaran {results.election.academic_year} · Total Suara: {results.total_votes}
            </p>
          </div>

          {results.total_votes === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              Belum ada suara.
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border">
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
                            <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-semibold text-white">
                              #1
                            </span>
                          ) : (
                            `#${i + 1}`
                          )}
                        </TableCell>
                        <TableCell>{c.candidateNumber}</TableCell>
                        <TableCell className="font-medium">
                          {c.chairman_name}
                          {c.vice_chairman_name ? (
                            <span className="text-muted-foreground"> & {c.vice_chairman_name}</span>
                          ) : null}
                        </TableCell>
                        <TableCell>{c.votes}</TableCell>
                        <TableCell>{c.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-xl border p-6">
                <h2 className="font-semibold">Grafik Suara</h2>
                <div className="mt-4 space-y-3">
                  {results.candidates.map((c) => (
                    <div key={c.candidateNumber} className="flex items-center gap-3">
                      <span className="w-8 shrink-0 text-right text-sm font-medium">
                        {c.candidateNumber}
                      </span>
                      <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
                        <div
                          className="flex h-full items-center rounded-md bg-blue-600 pl-2 text-xs font-medium text-white transition-all"
                          style={{ width: `${(c.votes / maxVotes) * 100}%` }}
                        >
                          {c.votes}
                        </div>
                      </div>
                      <span className="w-12 shrink-0 text-sm text-muted-foreground">
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
