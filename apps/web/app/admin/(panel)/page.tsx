'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listElections } from '@/services/elections';
import {
  getDashboardClasses,
  getDashboardMajors,
  getDashboardRoles,
  getDashboardSummary,
} from '@/services/dashboard';
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

  const { data: roles } = useQuery({
    queryKey: ['dashboard-roles', effectiveElectionId],
    queryFn: () => getDashboardRoles(effectiveElectionId),
    enabled: !!effectiveElectionId,
  });

  const isActive = selectedElection?.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Orivastra · Dashboard"
        title="Dashboard"
        description="Monitoring partisipasi voting siswa, guru, dan staf."
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
              label="Total Pemilih"
              value={
                summaryLoading ? '...' : (summary?.total_voters ?? summary?.total_students ?? 0)
              }
            />
            <StatCard
              label="Sudah Voting"
              value={summaryLoading ? '...' : (summary?.already_voted ?? 0)}
              accent="green"
            />
            <StatCard
              label="Partisipasi Siswa"
              value={
                summaryLoading
                  ? '...'
                  : `${summary?.students_voted ?? 0}/${summary?.students_total ?? summary?.total_students ?? 0} (${summary?.students_participation_rate ?? summary?.participation_rate ?? 0}%)`
              }
              accent="blue"
            />
            <StatCard
              label="Partisipasi Guru & Staf"
              value={
                summaryLoading
                  ? '...'
                  : `${summary?.staff_voted ?? 0}/${summary?.staff_total ?? 0} (${summary?.staff_participation_rate ?? 0}%)`
              }
              accent="orange"
            />
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading font-semibold text-lg">Partisipasi Keseluruhan</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Gabungan suara siswa, guru, dan tenaga kependidikan
                </p>
              </div>
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
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                Total <strong className="text-foreground">{summary?.already_voted ?? 0}</strong>{' '}
                dari{' '}
                <strong className="text-foreground">
                  {summary?.total_voters ?? summary?.total_students ?? 0}
                </strong>{' '}
                pemilih telah menggunakan hak suaranya
              </span>
              <span className="font-mono font-semibold text-primary">
                {summary?.participation_rate ?? 0}% Partisipasi
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="font-heading font-semibold">Guru &amp; Tenaga Kependidikan</h2>
              <div className="mt-4 space-y-4">
                {!roles || roles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada data guru/staf.</p>
                ) : (
                  roles.map((r) => (
                    <div key={r.name}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{r.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {r.voted}/{r.total} · {r.participation_rate}%
                        </span>
                      </div>
                      <Progress className="mt-1.5" value={r.participation_rate} />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="font-heading font-semibold">Siswa per Kelas</h2>
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
              <h2 className="font-heading font-semibold">Siswa per Jurusan</h2>
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
