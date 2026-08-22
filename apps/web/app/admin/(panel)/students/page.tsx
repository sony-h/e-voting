'use client';

/* eslint-disable react-hooks/set-state-in-effect -- pagination reset on filter change is intentional per spec */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, Download, Loader2, MoreHorizontal, Upload, Users } from 'lucide-react';
import type { Election, Student } from '@e-voting/types';
import { listElections } from '@/services/elections';
import {
  createStudent,
  deleteStudent,
  exportStudents,
  importStudents,
  listStudents,
  resetStudentToken,
  resetStudentVote,
  updateStudent,
} from '@/services/students';
import { ElectionSelect } from '@/components/admin/election-select';
import { TableToolbar } from '@/components/admin/table-toolbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface StudentForm {
  nis: string;
  nisn: string;
  full_name: string;
  class_name: string;
  major: string;
  grade: string;
}

const EMPTY_FORM: StudentForm = {
  nis: '',
  nisn: '',
  full_name: '',
  class_name: '',
  major: '',
  grade: '',
};

function toForm(s: Student): StudentForm {
  return {
    nis: s.nis,
    nisn: s.nisn ?? '',
    full_name: s.full_name,
    class_name: s.class_name,
    major: s.major ?? '',
    grade: s.grade ?? '',
  };
}

type StudentAction = { type: 'reset-vote' | 'reset-token' | 'delete'; student: Student };

function isEditable(status: Election['status']) {
  return status === 'DRAFT' || status === 'SCHEDULED';
}

function isResetTokenAllowed(status: Election['status']) {
  return status !== 'CLOSED';
}

const CLASS_FILTER_OPTIONS = [
  { value: 'all', label: 'Semua Kelas' },
  { value: 'X', label: 'Kelas X' },
  { value: 'XI', label: 'Kelas XI' },
  { value: 'XII', label: 'Kelas XII' },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Nama A-Z' },
  { value: 'class', label: 'Kelas' },
  { value: 'status', label: 'Status Voting' },
];

export default function AdminStudentsPage() {
  const queryClient = useQueryClient();
  const [electionId, setElectionId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM);
  const [confirmAction, setConfirmAction] = useState<StudentAction | null>(null);
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
    data: students,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['students', effectiveElectionId],
    queryFn: () => listStudents(effectiveElectionId),
    enabled: !!effectiveElectionId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['students', effectiveElectionId] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        nis: form.nis,
        nisn: form.nisn || undefined,
        full_name: form.full_name,
        class_name: form.class_name,
        major: form.major || undefined,
        grade: form.grade || undefined,
      };
      return editing
        ? updateStudent(editing.id, payload)
        : createStudent({ ...payload, election_id: effectiveElectionId });
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(editing ? 'Siswa diperbarui.' : 'Siswa ditambahkan.');
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    },
    onError: () => toast.error('Gagal menyimpan siswa.'),
  });

  const actionMutation = useMutation<unknown, Error, StudentAction>({
    mutationFn: (action: StudentAction) => {
      if (action.type === 'reset-vote') return resetStudentVote(action.student.id);
      if (action.type === 'reset-token') return resetStudentToken(action.student.id);
      return deleteStudent(action.student.id);
    },
    onSuccess: async (_, action) => {
      await invalidate();
      toast.success(
        action.type === 'reset-vote'
          ? 'Status voting direset.'
          : action.type === 'reset-token'
            ? 'Token baru dibuat.'
            : 'Siswa dihapus.',
      );
      setConfirmAction(null);
    },
    onError: () => {
      toast.error('Gagal menjalankan aksi.');
      setConfirmAction(null);
    },
  });

  const importMutation = useMutation({
    mutationFn: () => importStudents(effectiveElectionId, importFile!),
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

  function openEdit(student: Student) {
    setEditing(student);
    setForm(toForm(student));
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
    if (!students) return [];
    const q = search.toLowerCase().trim();
    const filtered = students.filter((s) => {
      const matchesSearch =
        !q ||
        s.nis.toLowerCase().includes(q) ||
        s.full_name.toLowerCase().includes(q) ||
        s.class_name.toLowerCase().includes(q);
      const getGrade = () => {
        const g = s.grade?.trim();
        if (g) return g.toLowerCase();
        const prefix = s.class_name.split('-')[0]?.trim().toLowerCase();
        return prefix ?? '';
      };
      const matchesStatus = statusFilter === 'all' || getGrade() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'class':
          return a.class_name.localeCompare(b.class_name);
        case 'status':
          return Number(a.has_voted) - Number(b.has_voted);
        case 'name_asc':
        default:
          return a.full_name.localeCompare(b.full_name);
      }
    });
    return filtered;
  }, [students, search, statusFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy, effectiveElectionId, students?.length]);

  useEffect(() => {
    // Clear selection when election changes
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
    const results = await Promise.allSettled(ids.map((id) => resetStudentVote(id)));
    const success = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - success;
    await invalidate();
    setSelectedIds(new Set());
    setBulkPending(false);
    if (failed === 0) toast.success(`${success} siswa berhasil direset.`);
    else toast.error(`${success} berhasil, ${failed} gagal direset.`);
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkPending(true);
    const results = await Promise.allSettled(ids.map((id) => deleteStudent(id)));
    const success = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - success;
    await invalidate();
    setSelectedIds(new Set());
    setBulkPending(false);
    if (failed === 0) toast.success(`${success} siswa berhasil dihapus.`);
    else toast.error(`${success} berhasil, ${failed} gagal dihapus.`);
  }

  async function handleExport() {
    try {
      setIsExporting(true);
      await exportStudents(effectiveElectionId);
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
        title="Students"
        description={`Kelola data siswa dan token voting (${total})`}
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
              Tambah Siswa
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <SkeletonTable rows={5} cols={8} />
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          <p>Gagal memuat data siswa. {error instanceof Error ? error.message : ''}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : (
        <>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Cari NIS, nama, kelas..."
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            statusOptions={CLASS_FILTER_OPTIONS}
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

          {!students || students.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Users className="size-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium">Belum ada siswa.</p>
                <p className="text-sm text-muted-foreground">
                  Klik &quot;Tambah Siswa&quot; atau import dari Excel untuk menambahkan data.
                </p>
                <Button
                  onClick={openCreate}
                  className="mt-2"
                  disabled={!effectiveElectionId || !editable}
                >
                  Tambah Siswa
                </Button>
              </div>
            </div>
          ) : filteredSorted.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Users className="size-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium">Tidak ada siswa yang cocok.</p>
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
                    <TableHead scope="col">NIS</TableHead>
                    <TableHead scope="col">Nama</TableHead>
                    <TableHead scope="col">Kelas</TableHead>
                    <TableHead scope="col">Jurusan</TableHead>
                    <TableHead scope="col">Token</TableHead>
                    <TableHead scope="col">Status Voting</TableHead>
                    <TableHead scope="col" className="text-right">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((student) => (
                    <TableRow
                      key={student.id}
                      data-state={selectedIds.has(student.id) ? 'selected' : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(student.id)}
                          onCheckedChange={(v) => toggleSelect(student.id, v === true)}
                          aria-label={`Pilih ${student.nis}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {student.nis}
                      </TableCell>
                      <TableCell
                        className="max-w-[18ch] truncate font-medium"
                        title={student.full_name}
                      >
                        {student.full_name}
                      </TableCell>
                      <TableCell>{student.class_name}</TableCell>
                      <TableCell>{student.major ?? '—'}</TableCell>
                      <TableCell>
                        {student.token?.token ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="max-w-[14ch] truncate font-mono text-xs"
                              title={student.token.token}
                            >
                              {student.token.token}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => copyToken(student.token!.token)}
                              aria-label={`Salin token ${student.nis}`}
                            >
                              <Copy aria-hidden="true" />
                            </Button>
                            <span
                              className={
                                student.token.is_used
                                  ? 'size-2 shrink-0 rounded-full bg-success'
                                  : 'size-2 shrink-0 rounded-full bg-muted-foreground/40'
                              }
                              title={student.token.is_used ? 'Sudah digunakan' : 'Belum digunakan'}
                              aria-hidden="true"
                            />
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={student.has_voted ? 'outline' : 'secondary'}
                          className={
                            student.has_voted
                              ? 'border-success/40 bg-success/10 text-success'
                              : undefined
                          }
                        >
                          {student.has_voted ? 'Sudah' : 'Belum'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Aksi ${student.nis}`}>
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
                                openEdit(student);
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
                                setConfirmAction({ type: 'reset-token', student });
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
                                setConfirmAction({ type: 'reset-vote', student });
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
                                setConfirmAction({ type: 'delete', student });
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
                  Menampilkan {total === 0 ? 0 : startIdx + 1}–{endIdx} dari {total} siswa
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
            <DialogTitle>{editing ? 'Edit Siswa' : 'Tambah Siswa'}</DialogTitle>
            <DialogDescription>Lengkapi data siswa di bawah ini.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nis">NIS</Label>
                <Input
                  id="nis"
                  value={form.nis}
                  onChange={(e) => setForm({ ...form, nis: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nisn">NISN</Label>
                <Input
                  id="nisn"
                  value={form.nisn}
                  onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="class_name">Kelas</Label>
                <Input
                  id="class_name"
                  value={form.class_name}
                  onChange={(e) => setForm({ ...form, class_name: e.target.value })}
                  placeholder="XII-1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="major">Jurusan</Label>
                <Input
                  id="major"
                  value={form.major}
                  onChange={(e) => setForm({ ...form, major: e.target.value })}
                  placeholder="IPA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  placeholder="XII"
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
              disabled={saveMutation.isPending || !form.nis || !form.full_name || !form.class_name}
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

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Siswa dari Excel</DialogTitle>
            <DialogDescription>
              Format kolom: NIS, NISN, Nama, Kelas, Jurusan, Grade.
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
                  {importResult.imported} siswa berhasil diimpor, {importResult.failed} gagal.
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

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'reset-vote' && 'Reset Status Voting?'}
              {confirmAction?.type === 'reset-token' && 'Buat Token Baru?'}
              {confirmAction?.type === 'delete' && 'Hapus Siswa?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'reset-vote' &&
                `Status voting "${confirmAction.student.full_name}" akan direset menjadi belum memilih.`}
              {confirmAction?.type === 'reset-token' &&
                `Token "${confirmAction.student.full_name}" akan diganti dengan token baru.`}
              {confirmAction?.type === 'delete' &&
                `Siswa "${confirmAction.student.full_name}" (NIS ${confirmAction.student.nis}) akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
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
