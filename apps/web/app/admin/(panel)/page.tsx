'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listElections } from '@/services/elections';
import { getDashboardClasses, getDashboardMajors, getDashboardSummary } from '@/services/dashboard';
import { ElectionSelect } from '@/components/admin/election-select';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { CountdownPill } from '@/components/ui/countdown-pill';
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
  ACTIVE: 'border-success/40 bg-success/10 text-success',
};

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Monitoring partisipasi voting."
        action={<ElectionSelect value={effectiveElectionId} onChange={setElectionId} />}
      />

      {!effectiveElectionId ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Belum ada election.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Siswa"
              value={summaryLoading ? '...' : (summary?.total_students ?? 0)}
            />
            <StatCard
              label="Sudah Voting"
              value={summaryLoading ? '...' : (summary?.already_voted ?? 0)}
              accent="green"
            />
            <StatCard
              label="Belum Voting"
              value={summaryLoading ? '...' : (summary?.not_voted ?? 0)}
              accent="orange"
            />
            <StatCard
              label="Partisipasi"
              value={summaryLoading ? '...' : `${summary?.participation_rate ?? 0}%`}
              accent="blue"
            />
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading font-semibold">Partisipasi Voting</h2>
              <div className="flex items-center gap-3">
                {isActive && <CountdownPill endAt={selectedElection?.end_at ?? null} />}
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
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="font-heading font-semibold">Progress per Kelas</h2>
              <div className="mt-4 space-y-4">
                {!classes || classes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada data kelas.</p>
                ) : (
                  classes.map((c) => (
                    <div key={c.name}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{c.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {c.voted}/{c.total} · {c.participation_rate}%
                        </span>
                      </div>
                      <Progress className="mt-1.5" value={c.participation_rate} />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="font-heading font-semibold">Progress per Jurusan</h2>
              <div className="mt-4 space-y-4">
                {!majors || majors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada data jurusan.</p>
                ) : (
                  majors.map((m) => (
                    <div key={m.name}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{m.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
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

      {summaryLoading && <Skeleton className="h-32 w-full" />}
    </div>
  );
}
