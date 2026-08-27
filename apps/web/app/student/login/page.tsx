'use client';

import { Suspense, useMemo, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'motion/react';
import {
  Check,
  ChevronsUpDown,
  GraduationCap,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Search,
} from 'lucide-react';
import { studentLogin } from '@/services/auth';
import { listPublicStaff, type PublicStaffItem } from '@/services/staff';
import { ApiError } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const reduced = useReducedMotion();

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

  const { data: rawStaffList, isLoading: isStaffLoading } = useQuery({
    queryKey: ['public-staff-list'],
    queryFn: () => listPublicStaff(),
    enabled: voterType === 'STAFF',
    staleTime: 60 * 1000,
  });

  // Client-side deduplication failsafe for staff list
  const staffList = useMemo(() => {
    if (!rawStaffList) return [];
    const seen = new Set<string>();
    const unique: PublicStaffItem[] = [];
    for (const item of rawStaffList) {
      const key = item.nip
        ? `nip:${item.nip}`
        : item.username
          ? `user:${item.username.toLowerCase()}`
          : `name:${item.full_name.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }
    return unique;
  }, [rawStaffList]);

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
                ? 'Anda telah menggunakan hak pilih pada seluruh pemilihan aktif.'
                : err.errorCode === 'ELECTION_NOT_ACTIVE'
                  ? 'Pemilihan belum dimulai atau sedang tidak aktif.'
                  : 'Login gagal. Periksa kembali NIS/NIP dan Token Voting Anda.',
        );
      } else {
        setError('Terjadi kesalahan koneksi. Silakan coba beberapa saat lagi.');
      }
    } finally {
      setLoading(false);
    }
  }

  const anim = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] as const },
      };

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Ambient background mesh */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -10%, var(--hero-tint), transparent)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-md">
        {/* Back Link */}
        <motion.div {...anim} className="mb-6 flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            ← Kembali ke Beranda
          </Link>
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            E-Voting SMANSA
          </span>
        </motion.div>

        {/* Header Branding */}
        <motion.div {...anim} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Portal Pemilihan Suara</span>
          </div>

          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Selamat Datang
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Masukkan identitas dan token voting Anda untuk menyalurkan hak suara secara rahasia.
          </p>
        </motion.div>

        {/* Role Switcher Tabs */}
        <motion.div
          {...anim}
          className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-border/70 bg-muted/60 p-1.5 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => {
              setVoterType('STUDENT');
              setIdentifier('');
              setSelectedStaff(null);
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
              voterType === 'STUDENT'
                ? 'bg-card text-foreground shadow-sm border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="h-4 w-4 text-primary" />
            <span>Siswa</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setVoterType('STAFF');
              setIdentifier('');
              setSelectedStaff(null);
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
              voterType === 'STAFF'
                ? 'bg-card text-foreground shadow-sm border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GraduationCap className="h-4 w-4 text-primary" />
            <span>Guru &amp; Staf</span>
          </button>
        </motion.div>

        {/* Main Login Card */}
        <motion.div
          {...anim}
          className="relative rounded-3xl border border-border/80 bg-card/85 p-7 sm:p-9 shadow-xl backdrop-blur-xl"
        >
          <form onSubmit={onSubmit} className="space-y-5">
            {voterType === 'STUDENT' ? (
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sm font-medium text-foreground">
                  Nomor Induk Siswa (NIS / NISN)
                </Label>
                <div className="relative">
                  <Input
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Contoh: 231001"
                    className="h-11 font-mono text-base tracking-wide rounded-xl bg-background/80"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Gunakan NIS Anda yang terdaftar pada panitia pemilihan.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="staff-select" className="text-sm font-medium text-foreground">
                  Pilih Nama Guru / Staf
                </Label>
                <div className="relative">
                  <button
                    type="button"
                    id="staff-select"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background/80 px-3.5 py-2 text-left text-sm shadow-xs outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <span
                      className={
                        selectedStaff
                          ? 'font-semibold text-foreground truncate'
                          : 'text-muted-foreground'
                      }
                    >
                      {selectedStaff ? (
                        <>
                          {selectedStaff.full_name}{' '}
                          <span className="font-mono text-xs font-normal text-muted-foreground">
                            {selectedStaff.nip
                              ? `(${selectedStaff.nip})`
                              : selectedStaff.username
                                ? `(${selectedStaff.username})`
                                : ''}
                          </span>
                        </>
                      ) : isStaffLoading ? (
                        'Memuat daftar guru & staf...'
                      ) : (
                        'Cari & pilih nama Anda...'
                      )}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute left-0 top-full z-50 mt-1.5 max-h-72 w-full overflow-hidden rounded-2xl border border-border/80 bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95">
                      <div className="border-b p-2.5">
                        <div className="relative flex items-center">
                          <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Ketik nama atau NIP..."
                            value={staffSearch}
                            onChange={(e) => setStaffSearch(e.target.value)}
                            autoFocus
                            className="h-9 pl-8 text-xs rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="max-h-52 overflow-y-auto p-1.5">
                        {filteredStaff.length === 0 ? (
                          <p className="p-4 text-center text-xs text-muted-foreground">
                            Nama guru/staf tidak ditemukan.
                          </p>
                        ) : (
                          filteredStaff.map((s) => {
                            const isSelected = selectedStaff?.id === s.id;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => handleSelectStaff(s)}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                                  isSelected
                                    ? 'bg-primary/10 font-semibold text-primary'
                                    : 'hover:bg-accent text-foreground'
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <p className="font-medium text-xs sm:text-sm leading-tight truncate">
                                    {s.full_name}
                                  </p>
                                  <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                                    <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-semibold text-foreground/80">
                                      {s.role === 'TEACHER' ? 'Guru' : 'Staf Tendik'}
                                    </span>
                                    {s.nip
                                      ? `NIP: ${s.nip}`
                                      : s.username
                                        ? `Kode: ${s.username}`
                                        : ''}
                                  </div>
                                </div>
                                {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
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
              <div className="flex justify-between items-center">
                <Label htmlFor="token" className="text-sm font-medium text-foreground">
                  Token Voting
                </Label>
                <span className="font-mono text-[11px] text-muted-foreground">8 Karakter</span>
              </div>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(maskToken(e.target.value))}
                className="h-12 font-mono text-lg uppercase tracking-[0.25em] text-center font-bold rounded-xl bg-background/80"
                placeholder="XXXX-XXXX"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Diberikan oleh panitia pemilihan. Berlaku untuk seluruh pemilihan aktif.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs sm:text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="leading-tight">{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || (voterType === 'STAFF' && !identifier) || token.length < 8}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm sm:text-base font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <span>Memverifikasi Token...</span>
              ) : (
                <>
                  <span>Masuk &amp; Mulai Memilih</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Security & Confidentiality Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 border-t border-dashed pt-4 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success shrink-0" />
            <span>Suara Anda dienkripsi secara anonim &amp; rahasia</span>
          </div>
        </motion.div>

        {/* Orivastra Footer Brandmark */}
        <motion.div {...anim} className="mt-8 text-center">
          <div className="inline-flex items-center gap-2">
            <Image
              src="/logo-orivastra-white-circle.png"
              alt="Orivastra"
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
            />
            <span className="font-heading text-xs font-bold tracking-[0.14em] text-foreground">
              ORIV<span className="text-primary">A</span>STRA
            </span>
          </div>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Technology Beyond Horizons
          </p>
        </motion.div>
      </div>
    </main>
  );
}
