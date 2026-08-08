'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/elections', label: 'Election' },
  { href: '/admin/candidates', label: 'Candidates' },
  { href: '/admin/students', label: 'Students' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAuth();

  return (
    <aside className="flex w-64 flex-col border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-6 font-semibold">E-Voting OSIS</div>
      <nav className="flex-1 space-y-1 p-4">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-4 py-2 text-sm font-medium ${
              pathname === item.href
                ? 'bg-blue-600 text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-4">
        <p className="text-sm font-medium">{admin?.username}</p>
        <button
          onClick={async () => {
            await logout();
            router.push('/admin/login');
          }}
          className="mt-2 text-sm text-red-600 hover:underline"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
