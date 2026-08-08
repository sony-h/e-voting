'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  const { data: elections } = useQuery({ queryKey: ['elections'], queryFn: listElections });
  const effectiveElectionId = electionId || elections?.[0]?.id || '';
  const selectedElection = elections?.find((e) => e.id === effectiveElectionId);

  const { data: students, isLoading } = useQuery({
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-sm text-muted-foreground">Kelola data siswa dan token voting.</p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <ElectionSelect value={effectiveElectionId} onChange={setElectionId} />
          <Button
            variant="outline"
            onClick={openImport}
            disabled={!effectiveElectionId || !editable}
          >
            Import Excel
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              exportStudents(effectiveElectionId).then(() => toast.success('Export berhasil.'))
            }
            disabled={!effectiveElectionId}
          >
            Export Excel
          </Button>
          <Button onClick={openCreate} disabled={!effectiveElectionId || !editable}>
            Tambah Siswa
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat...</p>
      ) : !students || students.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Belum ada siswa.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIS</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Jurusan</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Status Voting</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.nis}</TableCell>
                  <TableCell>{student.full_name}</TableCell>
                  <TableCell>{student.class_name}</TableCell>
                  <TableCell>{student.major ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{student.token?.token ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={student.has_voted ? 'default' : 'secondary'}>
                      {student.has_voted ? 'Sudah' : 'Belum'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(student)}
                        disabled={!editable}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmAction({ type: 'reset-token', student })}
                        disabled={!editable}
                      >
                        Reset Token
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmAction({ type: 'reset-vote', student })}
                        disabled={!editable}
                      >
                        Reset Voting
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => setConfirmAction({ type: 'delete', student })}
                        disabled={!editable}
                      >
                        Hapus
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
              {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
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
              <p className="text-sm text-muted-foreground">
                {importResult.imported} siswa berhasil diimpor, {importResult.failed} gagal.
              </p>
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
              {importMutation.isPending ? 'Mengimpor...' : 'Import'}
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
