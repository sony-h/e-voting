'use client';

/* eslint-disable react-hooks/set-state-in-effect -- pagination reset on filter change is intentional */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, Download, GraduationCap, Loader2, MoreHorizontal, Upload } from 'lucide-react';
import type { Election, StaffVoter } from '@e-voting/types';
import { StaffRole } from '@e-voting/types';
import { listElections } from '@/services/elections';
import {
  createStaff,
  deleteStaff,
  exportStaff,
  importStaff,
  listStaff,
  resetStaffToken,
  resetStaffVote,
  updateStaff,
} from '@/services/staff';
import { ElectionSelect } from '@/components/admin/election-select';
import { TableToolbar } from '@/components/admin/table-toolbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface StaffForm {
  nip: string;
  username: string;
  full_name: string;
  role: StaffRole;
}

const EMPTY_FORM: StaffForm = {
  nip: '',
  username: '',
  full_name: '',
  role: StaffRole.TEACHER,
};

function toForm(s: StaffVoter): StaffForm {
  return {
    nip: s.nip ?? '',
    username: s.username ?? '',
    full_name: s.full_name,
    role: s.role,
  };
}

type StaffAction = { type: 'reset-vote' | 'reset-token' | 'delete'; staff: StaffVoter };

function isEditable(status: Election['status']) {
  return status === 'DRAFT' || status === 'SCHEDULED';
}

function isResetTokenAllowed(status: Election['status']) {
  return status !== 'CLOSED';
}

const ROLE_FILTER_OPTIONS = [
  { value: 'all', label: 'Semua Role' },
  { value: 'TEACHER', label: 'Guru' },
  { value: 'STAFF', label: 'Tenaga Kependidikan / Staf' },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Nama A-Z' },
  { value: 'role', label: 'Role' },
  { value: 'status', label: 'Status Voting' },
];

export default function AdminStaffPage() {
  const queryClient = useQueryClient();
  const [electionId, setElectionId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StaffVoter | null>(null);
  const [form, setForm] = useState<StaffForm>(EMPTY_FORM);
  const [confirmAction, setConfirmAction] = useState<StaffAction | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; failed: number } | null>(
    null,
  );
  const importFileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: elections } = useQuery({ queryKey: ['elections'], queryFn: listElections });
  const effectiveElectionId = electionId || elections?.[0]?.id || '';
  const selectedElection = elections?.find((e) => e.id === effectiveElectionId);

  const {
    data: staffList,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['staff', effectiveElectionId],
    queryFn: () => listStaff(effectiveElectionId),
    enabled: !!effectiveElectionId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['staff', effectiveElectionId] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        nip: form.nip || undefined,
        username: form.username || undefined,
        full_name: form.full_name,
        role: form.role,
      };
      return editing
        ? updateStaff(editing.id, payload)
        : createStaff({ ...payload, election_id: effectiveElectionId });
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(editing ? 'Data guru/staf diperbarui.' : 'Guru/staf ditambahkan.');
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    },
    onError: () => toast.error('Gagal menyimpan data guru/staf.'),
  });

  const actionMutation = useMutation<unknown, Error, StaffAction>({
    mutationFn: (action: StaffAction) => {
      if (action.type === 'reset-vote') return resetStaffVote(action.staff.id);
      if (action.type === 'reset-token') return resetStaffToken(action.staff.id);
      return deleteStaff(action.staff.id);
    },
    onSuccess: async (_, action) => {
      await invalidate();
      toast.success(
        action.type === 'reset-vote'
          ? 'Status voting direset.'
          : action.type === 'reset-token'
            ? 'Token baru dibuat.'
            : 'Guru/staf dihapus.',
      );
      setConfirmAction(null);
    },
    onError: () => {
      toast.error('Gagal menjalankan aksi.');
      setConfirmAction(null);
    },
  });

  const importMutation = useMutation({
    mutationFn: () => importStaff(effectiveElectionId, importFile!),
    onSuccess: async (result) => {
      setImportResult({ imported: result.imported, failed: result.failed });
      await invalidate();
    },
    onError: () => toast.error('Gagal mengimpor file.'),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(staff: StaffVoter) {
    setEditing(staff);
    setForm(toForm(staff));
    setDialogOpen(true);
  }

  function openImport() {
    setImportFile(null);
    setImportResult(null);
    if (importFileRef.current) importFileRef.current.value = '';
    setImportOpen(true);
  }

  const editable = !!selectedElection && isEditable(selectedElection.status);
  const resetTokenAllowed = !!selectedElection && isResetTokenAllowed(selectedElection.status);

  const filteredSorted = useMemo(() => {
    if (!staffList) return [];
    const q = search.toLowerCase().trim();
    const filtered = staffList.filter((s) => {
      const matchesSearch =
        !q ||
        (s.nip && s.nip.toLowerCase().includes(q)) ||
        (s.username && s.username.toLowerCase().includes(q)) ||
        s.full_name.toLowerCase().includes(q);
      const matchesRole = statusFilter === 'all' || s.role === statusFilter;
      return matchesSearch && matchesRole;
    });
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'role':
          return a.role.localeCompare(b.role);
        case 'status':
          return Number(a.has_voted) - Number(b.has_voted);
        case 'name_asc':
        default:
          return a.full_name.localeCompare(b.full_name);
      }
    });
    return filtered;
  }, [staffList, search, statusFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy, effectiveElectionId, staffList?.length]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [effectiveElectionId]);

  const total = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const paginated = filteredSorted.slice(startIdx, startIdx + pageSize);

  const allPageSelected = paginated.length > 0 && paginated.every((s) => selectedIds.has(s.id));
  const somePageSelected = paginated.some((s) => selectedIds.has(s.id));

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        paginated.forEach((s) => next.add(s.id));
      } else {
        paginated.forEach((s) => next.delete(s.id));
      }
      return next;
    });
  }

  async function handleBulkReset() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkPending(true);
    const results = await Promise.allSettled(ids.map((id) => resetStaffVote(id)));
    const success = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - success;
    await invalidate();
    setSelectedIds(new Set());
    setBulkPending(false);
    if (failed === 0) toast.success(`${success} guru/staf berhasil direset.`);
    else toast.error(`${success} berhasil, ${failed} gagal direset.`);
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkPending(true);
    const results = await Promise.allSettled(ids.map((id) => deleteStaff(id)));
    const success = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - success;
    await invalidate();
    setSelectedIds(new Set());
    setBulkPending(false);
    if (failed === 0) toast.success(`${success} guru/staf berhasil dihapus.`);
    else toast.error(`${success} berhasil, ${failed} gagal dihapus.`);
  }

  async function handleExport() {
    try {
      setIsExporting(true);
      await exportStaff(effectiveElectionId);
      toast.success('Export berhasil.');
    } catch {
      toast.error('Gagal export.');
    } finally {
      setIsExporting(false);
    }
  }

  async function copyToken(token: string) {
    try {
      await navigator.clipboard.writeText(token);
      toast.success('Token disalin');
    } catch {
      toast.error('Gagal menyalin token.');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Orivastra · Guru & Staf"
        title="Guru & Staf"
        description={`Kelola data pemilih guru dan staf (${total})`}
        action={
          <div className="flex flex-wrap items-end gap-3">
            <ElectionSelect value={effectiveElectionId} onChange={setElectionId} />
            <Button
              variant="outline"
              onClick={openImport}
              disabled={!effectiveElectionId || !editable || importMutation.isPending}
            >
              {importMutation.isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Upload aria-hidden="true" />
              )}
              Import Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={!effectiveElectionId || isExporting}
            >
              {isExporting ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Download aria-hidden="true" />
              )}
              Export Excel
            </Button>
            <Button onClick={openCreate} disabled={!effectiveElectionId || !editable}>
              Tambah Guru/Staf
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <SkeletonTable rows={5} cols={7} />
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          <p>Gagal memuat data guru/staf. {error instanceof Error ? error.message : ''}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : (
        <>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Cari NIP, nama, username..."
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            statusOptions={ROLE_FILTER_OPTIONS}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOptions={SORT_OPTIONS}
          />

          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 px-4 py-3 text-sm">
              <p className="font-medium">{selectedIds.size} terpilih</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkReset}
                  disabled={bulkPending || !editable}
                  title={!editable ? 'Tidak dapat reset saat election aktif/closed' : undefined}
                >
                  {bulkPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                  Reset Terpilih
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkPending || !editable}
                  title={!editable ? 'Tidak dapat hapus saat election aktif/closed' : undefined}
                >
                  {bulkPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                  Hapus Terpilih
                </Button>
              </div>
            </div>
          )}

          {!staffList || staffList.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <GraduationCap className="size-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium">Belum ada data guru &amp; staf.</p>
                <p className="text-sm text-muted-foreground">
                  Klik &quot;Tambah Guru/Staf&quot; atau import dari Excel untuk menambahkan data.
                </p>
                <Button
                  onClick={openCreate}
                  className="mt-2"
                  disabled={!effectiveElectionId || !editable}
                >
                  Tambah Guru/Staf
                </Button>
              </div>
            </div>
          ) : filteredSorted.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <GraduationCap className="size-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium">Tidak ada data yang cocok.</p>
                <p className="text-sm text-muted-foreground">
                  Coba ubah filter atau kata kunci pencarian.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-10 bg-card hover:bg-card">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          allPageSelected ? true : somePageSelected ? 'indeterminate' : false
                        }
                        onCheckedChange={(v) => toggleSelectAll(v === true)}
                        aria-label="Pilih semua"
                      />
                    </TableHead>
                    <TableHead scope="col">NIP / Username</TableHead>
                    <TableHead scope="col">Nama Lengkap</TableHead>
                    <TableHead scope="col">Role</TableHead>
                    <TableHead scope="col">Token</TableHead>
                    <TableHead scope="col">Status Voting</TableHead>
                    <TableHead scope="col" className="text-right">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((staff) => (
                    <TableRow
                      key={staff.id}
                      data-state={selectedIds.has(staff.id) ? 'selected' : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(staff.id)}
                          onCheckedChange={(v) => toggleSelect(staff.id, v === true)}
                          aria-label={`Pilih ${staff.full_name}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {staff.nip || staff.username || '—'}
                      </TableCell>
                      <TableCell
                        className="max-w-[20ch] truncate font-medium"
                        title={staff.full_name}
                      >
                        {staff.full_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={staff.role === StaffRole.TEACHER ? 'default' : 'secondary'}>
                          {staff.role === StaffRole.TEACHER ? 'Guru' : 'Staf/Tendik'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {staff.token?.token ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="max-w-[14ch] truncate font-mono text-xs"
                              title={staff.token.token}
                            >
                              {staff.token.token}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => copyToken(staff.token!.token)}
                              aria-label={`Salin token ${staff.full_name}`}
                            >
                              <Copy aria-hidden="true" />
                            </Button>
                            <span
                              className={
                                staff.token.is_used
                                  ? 'size-2 shrink-0 rounded-full bg-success'
                                  : 'size-2 shrink-0 rounded-full bg-muted-foreground/40'
                              }
                              title={staff.token.is_used ? 'Sudah digunakan' : 'Belum digunakan'}
                              aria-hidden="true"
                            />
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={staff.has_voted ? 'outline' : 'secondary'}
                          className={
                            staff.has_voted
                              ? 'border-success/40 bg-success/10 text-success'
                              : undefined
                          }
                        >
                          {staff.has_voted ? 'Sudah' : 'Belum'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Aksi ${staff.full_name}`}
                            >
                              <MoreHorizontal aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={!editable}
                              title={
                                !editable
                                  ? 'Tidak dapat edit saat election aktif/closed'
                                  : undefined
                              }
                              onSelect={() => {
                                if (!editable) return;
                                openEdit(staff);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!resetTokenAllowed}
                              title={
                                !resetTokenAllowed
                                  ? 'Tidak dapat reset token saat election closed'
                                  : undefined
                              }
                              onSelect={() => {
                                if (!resetTokenAllowed) return;
                                setConfirmAction({ type: 'reset-token', staff });
                              }}
                            >
                              Reset Token
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!editable}
                              title={
                                !editable
                                  ? 'Tidak dapat reset voting saat election aktif/closed'
                                  : undefined
                              }
                              onSelect={() => {
                                if (!editable) return;
                                setConfirmAction({ type: 'reset-vote', staff });
                              }}
                            >
                              Reset Voting
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={!editable}
                              title={
                                !editable
                                  ? 'Tidak dapat hapus saat election aktif/closed'
                                  : undefined
                              }
                              onSelect={() => {
                                if (!editable) return;
                                setConfirmAction({ type: 'delete', staff });
                              }}
                            >
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3 text-sm">
                <p className="text-muted-foreground">
                  Menampilkan {total === 0 ? 0 : startIdx + 1}–{endIdx} dari {total} pemilih
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

      {/* Dialog Add / Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Data Guru/Staf' : 'Tambah Guru/Staf'}</DialogTitle>
            <DialogDescription>
              Lengkapi data pemilih guru atau tenaga kependidikan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nip">NIP (Opsional)</Label>
                <Input
                  id="nip"
                  value={form.nip}
                  onChange={(e) => setForm({ ...form, nip: e.target.value })}
                  placeholder="Contoh: 19800820..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username / Kode (Opsional)</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Contoh: guru-01"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Nama lengkap beserta gelar"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role / Posisi *</Label>
              <Select
                value={form.role}
                onValueChange={(val: StaffRole) => setForm({ ...form, role: val })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={StaffRole.TEACHER}>Guru</SelectItem>
                  <SelectItem value={StaffRole.STAFF}>Tenaga Kependidikan / Staf</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.full_name || (!form.nip && !form.username)}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" /> Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Import */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Guru &amp; Staf dari Excel</DialogTitle>
            <DialogDescription>
              Format kolom Excel: NIP, Username, Nama, Role (GURU / STAF).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="file"
              accept=".xlsx,.xls"
              ref={importFileRef}
              onChange={(e) => {
                setImportFile(e.target.files?.[0] ?? null);
                setImportResult(null);
              }}
            />
            {importResult && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {importResult.imported} berhasil diimpor, {importResult.failed} gagal.
                </p>
                {importResult.failed > 0 && (
                  <div
                    role="alert"
                    className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {importResult.failed} baris gagal diimpor. Periksa format Excel dan coba lagi.
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Tutup
            </Button>
            <Button
              onClick={() => importMutation.mutate()}
              disabled={!importFile || importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" /> Mengimpor...
                </>
              ) : (
                'Import'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation AlertDialog */}
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'reset-vote' && 'Reset Status Voting?'}
              {confirmAction?.type === 'reset-token' && 'Buat Token Baru?'}
              {confirmAction?.type === 'delete' && 'Hapus Data Guru/Staf?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'reset-vote' &&
                `Status voting "${confirmAction.staff.full_name}" akan direset menjadi belum memilih.`}
              {confirmAction?.type === 'reset-token' &&
                `Token "${confirmAction.staff.full_name}" akan diganti dengan token baru.`}
              {confirmAction?.type === 'delete' &&
                `"${confirmAction.staff.full_name}" akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && actionMutation.mutate(confirmAction)}
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
