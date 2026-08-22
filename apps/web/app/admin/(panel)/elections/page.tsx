'use client';

/* eslint-disable react-hooks/set-state-in-effect -- pagination reset on filter change is intentional per spec */
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarRange } from 'lucide-react';
import type { Election } from '@e-voting/types';
import {
  closeElection,
  createElection,
  listElections,
  startElection,
  updateElection,
} from '@/services/elections';
import { ApiError } from '@/lib/api';
import { formatPeriod } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { TableToolbar } from '@/components/admin/table-toolbar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Toaster } from '@/components/ui/sonner';

const STATUS_LABEL: Record<Election['status'], string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
};

const STATUS_VARIANT: Record<
  Election['status'],
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  DRAFT: 'outline',
  SCHEDULED: 'secondary',
  ACTIVE: 'default',
  CLOSED: 'destructive',
};

const STATUS_CLASS: Record<Election['status'], string> = {
  DRAFT: '',
  SCHEDULED: '',
  ACTIVE: 'bg-success text-success-foreground',
  CLOSED: '',
};

interface ElectionForm {
  title: string;
  description: string;
  academic_year: string;
  start_at: string;
  end_at: string;
  order: number;
}

const EMPTY_FORM: ElectionForm = {
  title: '',
  description: '',
  academic_year: '',
  start_at: '',
  end_at: '',
  order: 1,
};

function toForm(election: Election): ElectionForm {
  return {
    title: election.title,
    description: election.description ?? '',
    academic_year: election.academic_year,
    start_at: election.start_at ? new Date(election.start_at).toISOString().slice(0, 16) : '',
    end_at: election.end_at ? new Date(election.end_at).toISOString().slice(0, 16) : '',
    order: election.order ?? 1,
  };
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CLOSED', label: 'Closed' },
];

const SORT_OPTIONS = [
  { value: 'order', label: 'Urutan Terendah' },
  { value: 'order_desc', label: 'Urutan Tertinggi' },
  { value: 'period_desc', label: 'Periode Terbaru' },
  { value: 'period_asc', label: 'Periode Terlama' },
];

export default function AdminElectionsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Election | null>(null);
  const [form, setForm] = useState<ElectionForm>(EMPTY_FORM);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'start' | 'close';
    election: Election;
  } | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('order');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const {
    data: elections,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['elections'],
    queryFn: listElections,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['elections'] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        academic_year: form.academic_year,
        start_at: form.start_at ? new Date(form.start_at).toISOString() : undefined,
        end_at: form.end_at ? new Date(form.end_at).toISOString() : undefined,
        order: form.order,
      };
      return editing ? updateElection(editing.id, payload) : createElection(payload);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(editing ? 'Election diperbarui.' : 'Election dibuat.');
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Terjadi kesalahan.');
    },
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => startElection(id),
    onSuccess: async () => {
      await invalidate();
      toast.success('Election dimulai.');
      setConfirmAction(null);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Gagal memulai election.');
      setConfirmAction(null);
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => closeElection(id),
    onSuccess: async () => {
      await invalidate();
      toast.success('Election ditutup.');
      setConfirmAction(null);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Gagal menutup election.');
      setConfirmAction(null);
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(election: Election) {
    setEditing(election);
    setForm(toForm(election));
    setDialogOpen(true);
  }

  const filteredSorted = useMemo(() => {
    if (!elections) return [];
    const q = search.toLowerCase().trim();
    const filtered = elections.filter((e) => {
      const matchesSearch =
        !q || e.title.toLowerCase().includes(q) || e.academic_year.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    const getTime = (e: Election) => (e.start_at ? new Date(e.start_at).getTime() : 0);
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'order_desc':
          return (b.order ?? 1) - (a.order ?? 1);
        case 'period_desc':
          return getTime(b) - getTime(a);
        case 'period_asc':
          return getTime(a) - getTime(b);
        case 'order':
        default:
          return (a.order ?? 1) - (b.order ?? 1);
      }
    });
    return filtered;
  }, [elections, search, statusFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy, elections?.length]);

  const total = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const paginated = filteredSorted.slice(startIdx, startIdx + pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pemilihan"
        description={`Kelola periode pemilihan · ${elections?.length ?? 0} pemilihan`}
        action={<Button onClick={openCreate}>Tambah Pemilihan</Button>}
      />

      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          <p>Gagal memuat data pemilihan. {error instanceof Error ? error.message : ''}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : (
        <>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Cari pemilihan..."
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            statusOptions={STATUS_OPTIONS}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOptions={SORT_OPTIONS}
          />

          {!filteredSorted.length ? (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <CalendarRange className="size-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium">
                  {elections?.length === 0
                    ? 'Belum ada pemilihan.'
                    : 'Tidak ada pemilihan yang cocok.'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {elections?.length === 0
                    ? 'Klik "Tambah Pemilihan" untuk membuat yang pertama.'
                    : 'Coba ubah filter atau kata kunci pencarian.'}
                </p>
                {elections?.length === 0 && (
                  <Button onClick={openCreate} className="mt-2">
                    Tambah Pemilihan
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-card hover:bg-card">
                    <TableHead scope="col">Judul</TableHead>
                    <TableHead scope="col">Tahun Ajaran</TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col">Periode</TableHead>
                    <TableHead scope="col" className="w-12 text-center tabular-nums">
                      Urutan
                    </TableHead>
                    <TableHead scope="col" className="text-right">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((election) => (
                    <TableRow key={election.id}>
                      <TableCell
                        className="max-w-[28ch] truncate font-medium"
                        title={election.title}
                      >
                        {election.title}
                      </TableCell>
                      <TableCell>{election.academic_year}</TableCell>
                      <TableCell>
                        <Badge
                          variant={STATUS_VARIANT[election.status]}
                          className={STATUS_CLASS[election.status]}
                        >
                          ● {STATUS_LABEL[election.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatPeriod(election)}
                      </TableCell>
                      <TableCell className="w-12 text-center text-sm tabular-nums">
                        {election.order}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {election.status === 'ACTIVE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmAction({ type: 'close', election })}
                            >
                              Tutup
                            </Button>
                          )}
                          {(election.status === 'DRAFT' || election.status === 'SCHEDULED') && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => setConfirmAction({ type: 'start', election })}
                            >
                              Mulai
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => openEdit(election)}>
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3 text-sm">
                <p className="text-muted-foreground">
                  Menampilkan {total === 0 ? 0 : startIdx + 1}–{endIdx} dari {total} pemilihan
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Election' : 'Tambah Election'}</DialogTitle>
            <DialogDescription>Lengkapi informasi pemilihan di bawah ini.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Judul{' '}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                aria-required="true"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="academic_year">
                Tahun Ajaran{' '}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </Label>
              <Input
                id="academic_year"
                value={form.academic_year}
                onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                placeholder="2026/2027"
                required
                aria-required="true"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">Urutan</Label>
              <Input
                id="order"
                type="number"
                min={1}
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 1 })}
                aria-describedby="order-helper"
              />
              <p id="order-helper" className="text-xs text-muted-foreground">
                Urutan tampilan di halaman landing.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_at">Mulai</Label>
                <Input
                  id="start_at"
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_at">Selesai</Label>
                <Input
                  id="end_at"
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.title || !form.academic_year}
            >
              {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'start' ? 'Mulai Election?' : 'Tutup Election?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'start'
                ? `"${confirmAction?.election.title}" akan berstatus Active dan siswa dapat mulai memilih.`
                : `"${confirmAction?.election.title}" akan ditutup dan hasil dapat dilihat. Tindakan ini tidak dapat dibatalkan.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmAction?.type === 'close' ? 'destructive' : 'default'}
              onClick={() => {
                if (confirmAction?.type === 'start')
                  startMutation.mutate(confirmAction.election.id);
                if (confirmAction?.type === 'close')
                  closeMutation.mutate(confirmAction.election.id);
              }}
            >
              Ya
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </div>
  );
}
