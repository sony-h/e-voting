'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { studentLogin } from '@/services/auth';
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
  const [identifier, setIdentifier] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(
    expired ? 'Waktu voting habis. Silakan login kembali.' : null,
  );
  const [loading, setLoading] = useState(false);

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
            ? 'Token voting tidak valid.'
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
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <svg
              className="h-7 w-7 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 font-heading text-2xl font-bold">Masuk untuk Memilih</h1>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Login Siswa</CardTitle>
            <CardDescription>Masukkan NIS/NISN dan Token Voting Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">NIS / NISN</Label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="font-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">Token Voting</Label>
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(maskToken(e.target.value))}
                  className="font-mono tracking-widest uppercase"
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
              <Button type="submit" className="w-full" disabled={loading}>
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
