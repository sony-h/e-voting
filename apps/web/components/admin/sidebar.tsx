'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/elections', label: 'Election' },
  { href: '/admin/candidates', label: 'Candidates' },
  { href: '/admin/students', label: 'Students' },
  { href: '/admin/results', label: 'Results' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAuth();

  return (
    <aside className="flex w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-6">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          EV
        </span>
        <span className="font-heading font-semibold">E-Voting OSIS</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        <p className="px-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Menu
        </p>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              pathname === item.href
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center justify-between border-t p-4">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-medium">{admin?.username}</p>
          <button
            onClick={async () => {
              await logout();
              router.push('/admin/login');
            }}
            className="mt-1 text-sm text-destructive hover:underline"
          >
            Logout
          </button>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}
