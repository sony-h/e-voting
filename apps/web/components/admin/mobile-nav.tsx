'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  BarChart3,
  CalendarRange,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/elections', label: 'Pemilihan', icon: CalendarRange },
  { href: '/admin/candidates', label: 'Kandidat', icon: UsersRound },
  { href: '/admin/students', label: 'Siswa', icon: Users },
  { href: '/admin/staff', label: 'Guru & Staf', icon: GraduationCap },
  { href: '/admin/results', label: 'Hasil', icon: BarChart3 },
];

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAuth();

  return (
    <>
      <div className="flex h-14 items-center gap-2 border-b bg-card px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Buka menu navigasi"
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white p-1 shadow-sm ring-1 ring-foreground/10">
          <Image
            src="/logo-orivastra-white-circle.png"
            alt="Orivastra"
            width={32}
            height={32}
            className="h-6 w-6 object-contain"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-heading text-sm font-bold tracking-[0.14em] leading-none">
            ORIV<span className="text-primary">A</span>STRA
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] leading-none text-muted-foreground">
            E-Voting Panel
          </span>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-xs"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="relative flex h-full w-64 flex-col border-r bg-card shadow-xl">
            <div className="flex h-auto items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white p-1 shadow-sm ring-1 ring-foreground/10">
                  <Image
                    src="/logo-orivastra-white-circle.png"
                    alt="Orivastra"
                    width={32}
                    height={32}
                    className="h-6 w-6 object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading text-sm font-bold tracking-[0.14em] leading-none">
                    ORIV<span className="text-primary">A</span>STRA
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] leading-none text-muted-foreground">
                    E-Voting Panel
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Navigasi admin">
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
                    onClick={() => setOpen(false)}
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
        </div>
      )}
    </>
  );
}
