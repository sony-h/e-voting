'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listElections } from '@/services/elections';
import { getDashboardClasses, getDashboardMajors, getDashboardSummary } from '@/services/dashboard';
import { ElectionSelect } from '@/components/admin/election-select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'secondary',
  SCHEDULED: 'default',
  ACTIVE: 'outline',
  CLOSED: 'destructive',
};

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: 'border-green-600/30 bg-green-600/10 text-green-700 dark:text-green-400',
};

function useCountdown(endAt: string | Date | null, active: boolean) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!active || !endAt) return;
    const interval = setInterval(() => {
      const diff = new Date(endAt).getTime() - Date.now();
      setRemaining(Math.max(0, diff));
    }, 1000);
    return () => clearInterval(interval);
  }, [endAt, active]);

  return remaining;
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}j ${m}m ${s}d`;
}

export default function AdminDashboardPage() {
  const [electionId, setElectionId] = useState('');

  const { data: elections } = useQuery({ queryKey: ['elections'], queryFn: listElections });
  const effectiveElectionId = electionId || elections?.[0]?.id || '';
  const selectedElection = elections?.find((e) => e.id === effectiveElectionId);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary', effectiveElectionId],
    queryFn: () => getDashboardSummary(effectiveElectionId),
    enabled: !!effectiveElectionId,
  });

  const { data: classes } = useQuery({
    queryKey: ['dashboard-classes', effectiveElectionId],
    queryFn: () => getDashboardClasses(effectiveElectionId),
    enabled: !!effectiveElectionId,
  });

  const { data: majors } = useQuery({
    queryKey: ['dashboard-majors', effectiveElectionId],
    queryFn: () => getDashboardMajors(effectiveElectionId),
    enabled: !!effectiveElectionId,
  });

  const isActive = selectedElection?.status === 'ACTIVE';
  const remaining = useCountdown(selectedElection?.end_at ?? null, isActive);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Monitoring partisipasi voting.</p>
        </div>
        <ElectionSelect value={effectiveElectionId} onChange={setElectionId} />
      </div>

      {!effectiveElectionId ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Belum ada election.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border p-6">
              <p className="text-sm text-muted-foreground">Total Siswa</p>
              {summaryLoading ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <p className="mt-2 text-3xl font-bold">{summary?.total_students ?? 0}</p>
              )}
            </div>
            <div className="rounded-xl border p-6">
              <p className="text-sm text-muted-foreground">Sudah Voting</p>
              {summaryLoading ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {summary?.already_voted ?? 0}
                </p>
              )}
            </div>
            <div className="rounded-xl border p-6">
              <p className="text-sm text-muted-foreground">Belum Voting</p>
              {summaryLoading ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <p className="mt-2 text-3xl font-bold text-orange-600">{summary?.not_voted ?? 0}</p>
              )}
            </div>
            <div className="rounded-xl border p-6">
              <p className="text-sm text-muted-foreground">Partisipasi</p>
              {summaryLoading ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <p className="mt-2 text-3xl font-bold">{summary?.participation_rate ?? 0}%</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Partisipasi Voting</h2>
              <div className="flex items-center gap-3">
                {isActive && remaining > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Sisa waktu: <span className="font-mono">{formatRemaining(remaining)}</span>
                  </span>
                )}
                <Badge
                  variant={STATUS_VARIANT[selectedElection?.status ?? 'DRAFT'] ?? 'secondary'}
                  className={STATUS_CLASS[selectedElection?.status ?? '']}
                >
                  {selectedElection?.status ?? '—'}
                </Badge>
              </div>
            </div>
            <Progress className="mt-4" value={summary?.participation_rate ?? 0} />
            <p className="mt-2 text-sm text-muted-foreground">
              {summary?.already_voted ?? 0} dari {summary?.total_students ?? 0} siswa telah memilih
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border p-6">
              <h2 className="font-semibold">Progress per Kelas</h2>
              <div className="mt-4 space-y-4">
                {!classes || classes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada data kelas.</p>
                ) : (
                  classes.map((c) => (
                    <div key={c.name}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-muted-foreground">
                          {c.voted}/{c.total} · {c.participation_rate}%
                        </span>
                      </div>
                      <Progress className="mt-1.5" value={c.participation_rate} />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border p-6">
              <h2 className="font-semibold">Progress per Jurusan</h2>
              <div className="mt-4 space-y-4">
                {!majors || majors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada data jurusan.</p>
                ) : (
                  majors.map((m) => (
                    <div key={m.name}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground">
                          {m.voted}/{m.total} · {m.participation_rate}%
                        </span>
                      </div>
                      <Progress className="mt-1.5" value={m.participation_rate} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
