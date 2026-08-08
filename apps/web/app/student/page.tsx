'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { studentLogout, studentSession } from '@/services/auth';

export default function StudentPortalPage() {
  const router = useRouter();
  const { data: session, isLoading } = useQuery({
    queryKey: ['student-session'],
    queryFn: studentSession,
    retry: false,
  });

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center">Memuat...</main>;
  }

  if (!session) {
    return <main className="flex min-h-screen items-center justify-center">Sesi berakhir.</main>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold">Selamat Datang, {session.nis}</h1>
        <p className="mt-2 text-muted-foreground">
          Pemilihan akan segera dibuka. Nantikan informasi berikutnya.
        </p>
        <button
          onClick={async () => {
            await studentLogout();
            router.push('/');
          }}
          className="mt-6 text-sm text-blue-600 underline"
        >
          Keluar
        </button>
      </div>
    </main>
  );
}
