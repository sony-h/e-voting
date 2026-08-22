'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, CalendarRange, LayoutDashboard, Users, UsersRound } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/elections', label: 'Pemilihan', icon: CalendarRange },
  { href: '/admin/candidates', label: 'Kandidat', icon: UsersRound },
  { href: '/admin/students', label: 'Siswa', icon: Users },
  { href: '/admin/results', label: 'Hasil', icon: BarChart3 },
];

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAuth();

  return (
    <aside className="flex w-64 flex-col border-r bg-card" aria-label="Navigasi admin">
      <div className="flex h-14 items-center gap-2 border-b px-6">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          EV
        </span>
        <span className="font-heading font-semibold">E-Voting OSIS</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Menu utama">
        <p className="px-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Menu
        </p>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
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
