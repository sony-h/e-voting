'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MoreHorizontal } from 'lucide-react';
import type { Candidate, CandidateImage, Election } from '@e-voting/types';
import { API_BASE_URL } from '@/lib/api';
import { listElections } from '@/services/elections';
import {
  createCandidate,
  deleteCandidate,
  deleteCandidateImage,
  listCandidates,
  updateCandidate,
  uploadCandidateImages,
  uploadCandidatePhoto,
  uploadCandidatePoster,
  type CandidateWithImages,
} from '@/services/candidates';
import { ElectionSelect } from '@/components/admin/election-select';
import { TableToolbar } from '@/components/admin/table-toolbar';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  program_description: string;
  show_on_landing: boolean;
}

const EMPTY_FORM: CandidateForm = {
  candidate_number: '',
  chairman_name: '',
  vice_chairman_name: '',
  vision: '',
  mission: '',
  program_description: '',
  show_on_landing: true,
};

function toForm(c: Candidate): CandidateForm {
  return {
    candidate_number: String(c.candidate_number),
    chairman_name: c.chairman_name,
    vice_chairman_name: c.vice_chairman_name ?? '',
    vision: c.vision,
    mission: c.mission,
    program_description: c.program_description ?? '',
    show_on_landing: c.show_on_landing,
  };
}

function isEditable(status: Election['status']) {
  return status === 'DRAFT' || status === 'SCHEDULED';
}

export default function AdminCandidatesPage() {
  const queryClient = useQueryClient();
  const [electionId, setElectionId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CandidateWithImages | null>(null);
  const [form, setForm] = useState<CandidateForm>(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryToDelete, setGalleryToDelete] = useState<CandidateImage[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const posterRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('nomor');
  const [page, setPage] = useState(1);

  const { data: elections } = useQuery({ queryKey: ['elections'], queryFn: listElections });
  const effectiveElectionId = electionId || elections?.[0]?.id || '';
  const selectedElection = elections?.find((e) => e.id === effectiveElectionId);

  const {
    data: candidates,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['candidates', effectiveElectionId],
    queryFn: () => listCandidates(effectiveElectionId),
    enabled: !!effectiveElectionId,
  });

  const filteredSorted = useMemo(() => {
    if (!candidates) return [];
    let list = candidates.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.chairman_name.toLowerCase().includes(q) ||
        (c.vice_chairman_name ?? '').toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'landing' && c.show_on_landing) ||
        (statusFilter === 'hidden' && !c.show_on_landing);
      return matchSearch && matchStatus;
    });
    if (sortBy === 'nomor')
      list = [...list].sort((a, b) => a.candidate_number - b.candidate_number);
    else if (sortBy === 'nama')
      list = [...list].sort((a, b) => a.chairman_name.localeCompare(b.chairman_name));
    return list;
  }, [candidates, search, statusFilter, sortBy]);

  const paginated = useMemo(
    () => filteredSorted.slice((page - 1) * 10, page * 10),
    [filteredSorted, page],
  );
  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / 10));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, statusFilter, sortBy, effectiveElectionId]);

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
        program_description: form.program_description || undefined,
        show_on_landing: form.show_on_landing,
      };
      let saved: CandidateWithImages;
      if (editing) {
        saved = await updateCandidate(editing.id, payload);
        if (photoFile) saved = await uploadCandidatePhoto(editing.id, photoFile);
        if (posterFile) saved = await uploadCandidatePoster(editing.id, posterFile);
      } else {
        saved = await createCandidate(payload);
        if (photoFile) saved = await uploadCandidatePhoto(saved.id, photoFile);
        if (posterFile) saved = await uploadCandidatePoster(saved.id, posterFile);
      }
      if (galleryFiles.length > 0) {
        await uploadCandidateImages(saved.id, galleryFiles);
      }
      for (const image of galleryToDelete) {
        await deleteCandidateImage(image.id);
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
      setPosterFile(null);
      setGalleryFiles([]);
      setGalleryToDelete([]);
      if (fileRef.current) fileRef.current.value = '';
      if (posterRef.current) posterRef.current.value = '';
      if (galleryRef.current) galleryRef.current.value = '';
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
    setPosterFile(null);
    setGalleryFiles([]);
    setGalleryToDelete([]);
    if (fileRef.current) fileRef.current.value = '';
    if (posterRef.current) posterRef.current.value = '';
    if (galleryRef.current) galleryRef.current.value = '';
    setDialogOpen(true);
  }

  function openEdit(candidate: CandidateWithImages) {
    setEditing(candidate);
    setForm(toForm(candidate));
    setPhotoFile(null);
    setPosterFile(null);
    setGalleryFiles([]);
    setGalleryToDelete([]);
    if (fileRef.current) fileRef.current.value = '';
    if (posterRef.current) posterRef.current.value = '';
    if (galleryRef.current) galleryRef.current.value = '';
    setDialogOpen(true);
  }

  const editable = !!selectedElection && isEditable(selectedElection.status);
  const existingImages =
    editing?.images.filter((img) => !galleryToDelete.some((d) => d.id === img.id)) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Orivastra · Kandidat"
        title="Kandidat"
        description="Kelola kandidat untuk pemilihan yang dipilih."
        action={
          <div className="flex items-end gap-4">
            <ElectionSelect value={effectiveElectionId} onChange={setElectionId} />
            <Button onClick={openCreate} disabled={!effectiveElectionId || !editable}>
              Tambah Kandidat
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : isError ? (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          <span>Gagal memuat kandidat. Periksa koneksi dan coba lagi.</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : !candidates || candidates.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          <p>Belum ada kandidat.</p>
          <Button
            className="mt-4"
            onClick={openCreate}
            disabled={!effectiveElectionId || !editable}
          >
            Tambah Kandidat
          </Button>
        </div>
      ) : (
        <>
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Cari ketua / wakil..."
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            statusOptions={[
              { value: 'all', label: 'Semua' },
              { value: 'landing', label: 'Tampil' },
              { value: 'hidden', label: 'Tersembunyi' },
            ]}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOptions={[
              { value: 'nomor', label: 'Nomor' },
              { value: 'nama', label: 'Nama A-Z' },
            ]}
          />
          {filteredSorted.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              Tidak ada kandidat yang cocok.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead scope="col" className="w-12 text-center tabular-nums">
                      Nomor
                    </TableHead>
                    <TableHead scope="col">Foto</TableHead>
                    <TableHead scope="col" className="max-w-[16ch]">
                      Ketua
                    </TableHead>
                    <TableHead scope="col" className="max-w-[16ch]">
                      Wakil
                    </TableHead>
                    <TableHead scope="col">Tampil</TableHead>
                    <TableHead scope="col" className="text-right">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="w-12 text-center font-medium tabular-nums">
                        {candidate.candidate_number}
                      </TableCell>
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
                      <TableCell
                        className="max-w-[16ch] truncate font-medium"
                        title={candidate.chairman_name}
                      >
                        {candidate.chairman_name}
                      </TableCell>
                      <TableCell
                        className="max-w-[16ch] truncate"
                        title={candidate.vice_chairman_name ?? ''}
                      >
                        {candidate.vice_chairman_name ?? '—'}
                      </TableCell>
                      <TableCell>
                        {candidate.show_on_landing ? (
                          <Badge variant="default">Landing</Badge>
                        ) : (
                          <Badge variant="outline">Tersembunyi</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Aksi ${candidate.chairman_name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openEdit(candidate)}
                              disabled={!editable}
                              title={!editable ? 'Terkunci saat voting berlangsung' : undefined}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(candidate)}
                              disabled={!editable}
                              title={!editable ? 'Terkunci saat voting berlangsung' : undefined}
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
              {filteredSorted.length > 10 && (
                <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Menampilkan {(page - 1) * 10 + 1}–{Math.min(page * 10, filteredSorted.length)}{' '}
                    dari {filteredSorted.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Kandidat' : 'Tambah Kandidat'}</DialogTitle>
            <DialogDescription>Lengkapi informasi kandidat di bawah ini.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="candidate_number">
                  Nomor Urut <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="candidate_number"
                  type="number"
                  min={1}
                  value={form.candidate_number}
                  onChange={(e) => setForm({ ...form, candidate_number: e.target.value })}
                  required
                  aria-required="true"
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
                <p className="text-xs text-muted-foreground">
                  Maks 10MB · lebar minimal 800px · rasio disarankan 4:3
                </p>
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
              <Label htmlFor="vision">
                Visi <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="vision"
                rows={3}
                value={form.vision}
                onChange={(e) => setForm({ ...form, vision: e.target.value })}
                required
                aria-required="true"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mission">
                Misi <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="mission"
                rows={3}
                value={form.mission}
                onChange={(e) => setForm({ ...form, mission: e.target.value })}
                required
                aria-required="true"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="program_description">Deskripsi Program</Label>
              <Textarea
                id="program_description"
                rows={4}
                value={form.program_description}
                onChange={(e) => setForm({ ...form, program_description: e.target.value })}
                placeholder="Jelaskan program unggulan kandidat..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="poster">Poster Kampanye</Label>
              <Input
                id="poster"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                ref={posterRef}
                onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                Maks 10MB · lebar minimal 800px · rasio disarankan 2:3 (poster)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="show_on_landing">Tampilkan di Landing Page</Label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  id="show_on_landing"
                  type="checkbox"
                  checked={form.show_on_landing}
                  onChange={(e) => setForm({ ...form, show_on_landing: e.target.checked })}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                Kandidat ini muncul di halaman landing publik
              </label>
            </div>
            <div className="space-y-2 border-t pt-4">
              <Label>Galeri Program</Label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                ref={galleryRef}
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length > 5) toast.error(`Maks 5 file, ${files.length - 5} diabaikan`);
                  setGalleryFiles(files.slice(0, 5));
                }}
              />
              <p className="text-xs text-muted-foreground">
                Format jpeg/png/webp · maks 10MB per file · lebar minimal 800px · rasio disarankan
                16:9
              </p>
              {(existingImages.length > 0 || galleryFiles.length > 0) && (
                <div className="grid grid-cols-3 gap-2">
                  {existingImages.map((image) => (
                    <div key={image.id} className="group relative">
                      <Image
                        src={`${API_BASE_URL.replace('/api/v1', '')}${image.url}`}
                        alt={image.caption ?? 'Gambar program'}
                        width={120}
                        height={120}
                        className="h-20 w-full rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setGalleryToDelete([...galleryToDelete, image])}
                        className="absolute right-1 top-1 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-white"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                  {galleryFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt="Gambar baru"
                        width={120}
                        height={120}
                        className="h-20 w-full rounded-lg object-cover"
                      />
                      <span className="absolute right-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        Baru
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
              variant="destructive"
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
