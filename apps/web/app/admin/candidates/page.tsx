'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Candidate, Election } from '@e-voting/types';
import { API_BASE_URL } from '@/lib/api';
import { listElections } from '@/services/elections';
import {
  createCandidate,
  deleteCandidate,
  listCandidates,
  updateCandidate,
  uploadCandidatePhoto,
} from '@/services/candidates';
import { ElectionSelect } from '@/components/admin/election-select';
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

interface CandidateForm {
  candidate_number: string;
  chairman_name: string;
  vice_chairman_name: string;
  vision: string;
  mission: string;
}

const EMPTY_FORM: CandidateForm = {
  candidate_number: '',
  chairman_name: '',
  vice_chairman_name: '',
  vision: '',
  mission: '',
};

function toForm(c: Candidate): CandidateForm {
  return {
    candidate_number: String(c.candidate_number),
    chairman_name: c.chairman_name,
    vice_chairman_name: c.vice_chairman_name ?? '',
    vision: c.vision,
    mission: c.mission,
  };
}

function isEditable(status: Election['status']) {
  return status === 'DRAFT' || status === 'SCHEDULED';
}

export default function AdminCandidatesPage() {
  const queryClient = useQueryClient();
  const [electionId, setElectionId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [form, setForm] = useState<CandidateForm>(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: elections } = useQuery({ queryKey: ['elections'], queryFn: listElections });
  const effectiveElectionId = electionId || elections?.[0]?.id || '';
  const selectedElection = elections?.find((e) => e.id === effectiveElectionId);

  const { data: candidates, isLoading } = useQuery({
    queryKey: ['candidates', effectiveElectionId],
    queryFn: () => listCandidates(effectiveElectionId),
    enabled: !!effectiveElectionId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['candidates', effectiveElectionId] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        election_id: effectiveElectionId,
        candidate_number: Number(form.candidate_number),
        chairman_name: form.chairman_name,
        vice_chairman_name: form.vice_chairman_name || undefined,
        vision: form.vision,
        mission: form.mission,
      };
      let saved: Candidate;
      if (editing) {
        saved = await updateCandidate(editing.id, payload);
        if (photoFile) saved = await uploadCandidatePhoto(editing.id, photoFile);
      } else {
        saved = await createCandidate(payload);
        if (photoFile) saved = await uploadCandidatePhoto(saved.id, photoFile);
      }
      return saved;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(editing ? 'Kandidat diperbarui.' : 'Kandidat ditambahkan.');
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      setPhotoFile(null);
      if (fileRef.current) fileRef.current.value = '';
    },
    onError: () => toast.error('Gagal menyimpan kandidat.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCandidate(id),
    onSuccess: async () => {
      await invalidate();
      toast.success('Kandidat dihapus.');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Gagal menghapus kandidat.'),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPhotoFile(null);
    if (fileRef.current) fileRef.current.value = '';
    setDialogOpen(true);
  }

  function openEdit(candidate: Candidate) {
    setEditing(candidate);
    setForm(toForm(candidate));
    setPhotoFile(null);
    if (fileRef.current) fileRef.current.value = '';
    setDialogOpen(true);
  }

  const editable = !!selectedElection && isEditable(selectedElection.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Candidates</h1>
          <p className="text-sm text-muted-foreground">
            Kelola kandidat untuk election yang dipilih.
          </p>
        </div>
        <div className="flex items-end gap-4">
          <ElectionSelect value={effectiveElectionId} onChange={setElectionId} />
          <Button onClick={openCreate} disabled={!effectiveElectionId || !editable}>
            Tambah Kandidat
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat...</p>
      ) : !candidates || candidates.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Belum ada kandidat.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor</TableHead>
                <TableHead>Foto</TableHead>
                <TableHead>Ketua</TableHead>
                <TableHead>Wakil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell className="font-medium">{candidate.candidate_number}</TableCell>
                  <TableCell>
                    {candidate.photo_url ? (
                      <Image
                        src={`${API_BASE_URL.replace('/api/v1', '')}${candidate.photo_url}`}
                        alt={candidate.chairman_name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                        No foto
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{candidate.chairman_name}</TableCell>
                  <TableCell>{candidate.vice_chairman_name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge>{selectedElection?.status ?? '—'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(candidate)}
                        disabled={!editable}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => setDeleteTarget(candidate)}
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
            <DialogTitle>{editing ? 'Edit Kandidat' : 'Tambah Kandidat'}</DialogTitle>
            <DialogDescription>Lengkapi informasi kandidat di bawah ini.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="candidate_number">Nomor Urut</Label>
                <Input
                  id="candidate_number"
                  type="number"
                  min={1}
                  value={form.candidate_number}
                  onChange={(e) => setForm({ ...form, candidate_number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo">Foto</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  ref={fileRef}
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chairman_name">Nama Ketua</Label>
              <Input
                id="chairman_name"
                value={form.chairman_name}
                onChange={(e) => setForm({ ...form, chairman_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vice_chairman_name">Nama Wakil</Label>
              <Input
                id="vice_chairman_name"
                value={form.vice_chairman_name}
                onChange={(e) => setForm({ ...form, vice_chairman_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vision">Visi</Label>
              <Textarea
                id="vision"
                value={form.vision}
                onChange={(e) => setForm({ ...form, vision: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mission">Misi</Label>
              <Textarea
                id="mission"
                value={form.mission}
                onChange={(e) => setForm({ ...form, mission: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={
                saveMutation.isPending ||
                !form.candidate_number ||
                !form.chairman_name ||
                !form.vision ||
                !form.mission
              }
            >
              {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kandidat?</AlertDialogTitle>
            <AlertDialogDescription>
              Kandidat &quot;{deleteTarget?.chairman_name}&quot; akan dihapus. Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </div>
  );
}
