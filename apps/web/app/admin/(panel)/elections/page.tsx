'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  DRAFT: 'secondary',
  SCHEDULED: 'default',
  ACTIVE: 'outline',
  CLOSED: 'destructive',
};

const STATUS_CLASS: Record<Election['status'], string> = {
  DRAFT: '',
  SCHEDULED: '',
  ACTIVE: 'border-success/40 bg-success/10 text-success',
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

export default function AdminElectionsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Election | null>(null);
  const [form, setForm] = useState<ElectionForm>(EMPTY_FORM);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'start' | 'close';
    election: Election;
  } | null>(null);

  const { data: elections, isLoading } = useQuery({
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Election</h1>
        <Button onClick={openCreate}>Tambah Election</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat...</p>
      ) : !elections || elections.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Belum ada Election. Klik &quot;Tambah Election&quot; untuk membuat yang pertama.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Tahun Ajaran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead className="w-20">Urutan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {elections.map((election) => (
                <TableRow key={election.id}>
                  <TableCell className="font-medium">{election.title}</TableCell>
                  <TableCell>{election.academic_year}</TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_VARIANT[election.status]}
                      className={STATUS_CLASS[election.status]}
                    >
                      {STATUS_LABEL[election.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatPeriod(election)}
                  </TableCell>
                  <TableCell className="text-sm">{election.order}</TableCell>
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
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Election' : 'Tambah Election'}</DialogTitle>
            <DialogDescription>Lengkapi informasi pemilihan di bawah ini.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="academic_year">Tahun Ajaran</Label>
              <Input
                id="academic_year"
                value={form.academic_year}
                onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                placeholder="2026/2027"
                required
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
              />
              <p className="text-xs text-muted-foreground">Urutan tampilan di halaman landing.</p>
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
