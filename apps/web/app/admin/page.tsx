'use client';

import { useQuery } from '@tanstack/react-query';
import { listElections } from '@/services/elections';

export default function AdminDashboardPage() {
  const { data: elections, isLoading } = useQuery({
    queryKey: ['elections'],
    queryFn: listElections,
  });
  const active = elections?.find((e) => e.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Total Election</p>
          <p className="mt-2 text-3xl font-bold">{isLoading ? '...' : (elections?.length ?? 0)}</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Election Aktif</p>
          <p className="mt-2 text-3xl font-bold">{active ? active.title : 'Tidak ada'}</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="mt-2 text-3xl font-bold">{active ? 'ACTIVE' : '—'}</p>
        </div>
      </div>
    </div>
  );
}
