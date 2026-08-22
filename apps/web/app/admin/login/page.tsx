'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { adminLogin } from '@/services/auth';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const profile = await adminLogin(username, password);
      login(profile);
      router.push('/admin');
    } catch (err) {
      if (err instanceof ApiError && err.errorCode === 'INVALID_CREDENTIALS') {
        setError('Username atau password salah.');
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="absolute -top-24 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-32 right-1/3 h-[360px] w-[360px] rounded-full bg-primary/6 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-foreground/10">
            <Image
              src="/logo-orivastra-white-circle.png"
              alt="Orivastra"
              width={40}
              height={40}
              className="h-8 w-8 object-contain"
              priority
            />
          </div>
          <div className="mt-3 flex flex-col items-center">
            <span className="font-heading text-sm font-bold tracking-[0.14em] text-foreground">
              ORIV<span className="text-primary">A</span>STRA
            </span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              From Origin to the Stars.
            </span>
          </div>
          <div className="mt-6 flex flex-col items-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              E-Voting
            </span>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Admin Portal</h1>
            <p className="mt-1.5 max-w-[28ch] text-sm text-muted-foreground">
              Masuk sebagai panitia — kelola pemilihan dengan presisi.
            </p>
          </div>
        </div>

        <Card className="rounded-2xl border bg-card/80 shadow-sm backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="sr-only">Masuk</CardTitle>
            <CardDescription className="text-center text-sm">
              Gunakan kredensial panitia untuk melanjutkan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs uppercase tracking-widest">
                  Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11 rounded-xl font-mono"
                  required
                  aria-required="true"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-widest">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl"
                  required
                  aria-required="true"
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive"
                >
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
                className="h-11 w-full rounded-xl text-[15px] font-semibold shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center font-mono text-xs text-muted-foreground">
          © {new Date().getFullYear()} Orivastra — Technology Beyond Horizons
        </p>
      </div>
    </main>
  );
}
