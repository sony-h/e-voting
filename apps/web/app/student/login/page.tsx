'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { studentLogin } from '@/services/auth';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
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
            : err.errorCode === 'ALREADY_VOTED'
              ? 'Anda sudah menggunakan hak pilih.'
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login Siswa</CardTitle>
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Token Voting</Label>
              <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
