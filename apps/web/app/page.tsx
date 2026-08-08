import Link from 'next/link';
import { listElections } from '@/services/elections';
import { formatPeriod } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const elections = await listElections().catch(() => []);
  const election = elections.find((e) => e.status === 'ACTIVE') ?? elections[0];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl rounded-2xl border bg-card p-8 shadow-sm">
        {election ? (
          <>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              {election.status === 'ACTIVE' ? 'Sedang Berlangsung' : election.status}
            </span>
            <h1 className="mt-4 text-2xl font-bold">{election.title}</h1>
            <p className="mt-2 text-muted-foreground">{election.description}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Tahun Ajaran {election.academic_year} · {formatPeriod(election)}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Pemilihan Ketua OSIS</h1>
            <p className="mt-2 text-muted-foreground">Belum ada pemilihan yang dijadwalkan.</p>
          </>
        )}
        <div className="mt-8 border-t pt-6">
          <p className="text-sm text-muted-foreground">
            Siap memilih? Gunakan NIS/NISN dan Token Voting yang diberikan panitia untuk memilih
            pemimpinmu.
          </p>
          <Link
            href="/student/login"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Siap Memilih — Klik di Sini
          </Link>
        </div>
      </div>
    </main>
  );
}
