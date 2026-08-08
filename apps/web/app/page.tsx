import Link from 'next/link';
import { listElections } from '@/services/elections';
import { formatPeriod } from '@/lib/format';
import { BallotStamp, type BallotStatus } from '@/components/ui/ballot-stamp';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const elections = await listElections().catch(() => []);
  const election = elections.find((e) => e.status === 'ACTIVE') ?? elections[0];
  const status: BallotStatus = (election?.status as BallotStatus) ?? 'DRAFT';

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, var(--hero-tint), transparent)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative w-full max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Pemilihan Ketua OSIS{election ? ` · ${election.academic_year}` : ''}
        </p>

        <h1 className="mt-4 font-heading text-4xl font-bold leading-tight sm:text-5xl">
          Pilih Pemimpin OSIS-mu
        </h1>

        {election ? (
          <>
            <div className="mt-6 flex justify-center">
              <BallotStamp status={status} />
            </div>
            <h2 className="mt-6 font-heading text-xl font-semibold text-muted-foreground">
              {election.title}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {election.description ??
                'Satu siswa, satu suara. Pilihanmu menentukan masa depan OSIS.'}
            </p>
            <p className="mt-4 font-mono text-sm text-muted-foreground">{formatPeriod(election)}</p>
          </>
        ) : (
          <>
            <div className="mt-6 flex justify-center">
              <BallotStamp status="DRAFT" />
            </div>
            <p className="mx-auto mt-6 max-w-md text-sm text-muted-foreground">
              Belum ada pemilihan yang dijadwalkan. Nantikan informasi dari panitia.
            </p>
          </>
        )}

        <div className="mx-auto mt-10 max-w-md border-t pt-8">
          <p className="text-sm text-muted-foreground">
            Gunakan NIS/NISN dan Token Voting dari panitia untuk memilih pemimpinmu.
          </p>
          <Link
            href="/student/login"
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md"
          >
            Siap Memilih — Klik di Sini
          </Link>
        </div>
      </div>
    </main>
  );
}
