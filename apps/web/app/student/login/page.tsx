'use client';

import { Suspense, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, GraduationCap, User } from 'lucide-react';
import { studentLogin } from '@/services/auth';
import { listPublicStaff, type PublicStaffItem } from '@/services/staff';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function maskToken(raw: string): string {
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z2-9]/g, '')
    .slice(0, 8);
  if (cleaned.length <= 4) return cleaned;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

export default function StudentLoginPage() {
  return (
    <Suspense>
      <StudentLoginForm />
    </Suspense>
  );
}

function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get('expired') === '1';

  const [voterType, setVoterType] = useState<'STUDENT' | 'STAFF'>('STUDENT');
  const [identifier, setIdentifier] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(
    expired ? 'Waktu voting habis. Silakan login kembali.' : null,
  );
  const [loading, setLoading] = useState(false);

  // Search & dropdown state for staff
  const [staffSearch, setStaffSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<PublicStaffItem | null>(null);

  const { data: staffList, isLoading: isStaffLoading } = useQuery({
    queryKey: ['public-staff-list'],
    queryFn: () => listPublicStaff(),
    enabled: voterType === 'STAFF',
    staleTime: 60 * 1000,
  });

  const filteredStaff = useMemo(() => {
    if (!staffList) return [];
    const q = staffSearch.toLowerCase().trim();
    if (!q) return staffList;
    return staffList.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        (s.nip && s.nip.toLowerCase().includes(q)) ||
        (s.username && s.username.toLowerCase().includes(q)),
    );
  }, [staffList, staffSearch]);

  function handleSelectStaff(s: PublicStaffItem) {
    setSelectedStaff(s);
    setIdentifier(s.nip || s.username || s.id);
    setDropdownOpen(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await studentLogin(identifier, token);
      router.push('/student');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.errorCode === 'INVALID_TOKEN'
            ? 'Token voting tidak valid atau data pemilih tidak cocok.'
            : err.errorCode === 'TOKEN_EXPIRED'
              ? 'Token sudah kedaluwarsa. Hubungi panitia untuk token baru.'
              : err.errorCode === 'ALREADY_VOTED'
                ? 'Anda telah menggunakan hak pilih Anda.'
                : err.errorCode === 'ELECTION_NOT_ACTIVE'
                  ? 'Pemilihan belum dimulai.'
                  : 'Login gagal. Periksa kembali data Anda.',
        );
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            {voterType === 'STUDENT' ? (
              <User className="h-7 w-7 text-primary" />
            ) : (
              <GraduationCap className="h-7 w-7 text-primary" />
            )}
          </div>
          <h1 className="mt-4 font-heading text-2xl font-bold">Masuk untuk Memilih</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gunakan hak suara Anda secara rahasia dan aman
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="mb-4 grid grid-cols-2 rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => {
              setVoterType('STUDENT');
              setIdentifier('');
              setSelectedStaff(null);
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
              voterType === 'STUDENT'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="h-4 w-4" />
            Siswa
          </button>
          <button
            type="button"
            onClick={() => {
              setVoterType('STAFF');
              setIdentifier('');
              setSelectedStaff(null);
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
              voterType === 'STAFF'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            Guru &amp; Staf
          </button>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              {voterType === 'STUDENT' ? 'Login Siswa' : 'Login Guru & Tenaga Kependidikan'}
            </CardTitle>
            <CardDescription>
              {voterType === 'STUDENT'
                ? 'Masukkan NIS/NISN dan Token Voting Anda.'
                : 'Pilih nama Anda dari daftar dan masukkan Token Voting.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {voterType === 'STUDENT' ? (
                <div className="space-y-2">
                  <Label htmlFor="identifier">NIS / NISN</Label>
                  <Input
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Contoh: 231001"
                    className="font-mono"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="staff-select">Pilih Guru / Staf</Label>
                  <div className="relative">
                    <button
                      type="button"
                      id="staff-select"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-left text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <span className={selectedStaff ? 'font-medium' : 'text-muted-foreground'}>
                        {selectedStaff
                          ? `${selectedStaff.full_name} ${selectedStaff.nip ? `(${selectedStaff.nip})` : selectedStaff.username ? `(${selectedStaff.username})` : ''}`
                          : isStaffLoading
                            ? 'Memuat daftar guru & staf...'
                            : 'Cari & pilih nama guru / staf...'}
                      </span>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
                        <div className="border-b p-2">
                          <Input
                            type="text"
                            placeholder="Cari nama atau NIP..."
                            value={staffSearch}
                            onChange={(e) => setStaffSearch(e.target.value)}
                            autoFocus
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto p-1">
                          {filteredStaff.length === 0 ? (
                            <p className="p-3 text-center text-xs text-muted-foreground">
                              Tidak ditemukan.
                            </p>
                          ) : (
                            filteredStaff.map((s) => {
                              const isSelected = selectedStaff?.id === s.id;
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => handleSelectStaff(s)}
                                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                    isSelected
                                      ? 'bg-primary/10 font-medium text-primary'
                                      : 'hover:bg-muted'
                                  }`}
                                >
                                  <div>
                                    <p className="font-medium leading-tight">{s.full_name}</p>
                                    <p className="font-mono text-xs text-muted-foreground">
                                      {s.role === 'TEACHER' ? 'Guru' : 'Staf/Tendik'}
                                      {s.nip
                                        ? ` • NIP: ${s.nip}`
                                        : s.username
                                          ? ` • Kode: ${s.username}`
                                          : ''}
                                    </p>
                                  </div>
                                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <input type="hidden" value={identifier} required />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="token">Token Voting</Label>
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(maskToken(e.target.value))}
                  className="font-mono text-base uppercase tracking-widest"
                  placeholder="XXXX-XXXX"
                  required
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4m0 4h.01M10.29 3.86l-8.3 14.42A2 2 0 0 0 3.65 21h16.7a2 2 0 0 0 1.66-3.14l-8.3-14.42a2 2 0 0 0-3.32 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full text-base font-semibold"
                disabled={loading || (voterType === 'STAFF' && !identifier)}
              >
                {loading ? 'Memproses...' : 'Masuk'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm">
          <Link
            href="/"
            className="text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Kembali ke beranda
          </Link>
        </p>
      </div>
    </main>
  );
}
