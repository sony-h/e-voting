import { MobileNav } from '@/components/admin/mobile-nav';
import { Sidebar } from '@/components/admin/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Lewati ke konten
      </a>
      <div className="hidden lg:flex lg:w-64 lg:shrink-0">
        <Sidebar />
      </div>
      <div className="relative isolate flex min-w-0 flex-1 flex-col overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-24 right-1/4 h-[420px] w-[720px] rounded-full bg-primary/[0.04] blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-[320px] w-[320px] rounded-full bg-primary/[0.03] blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>
        <MobileNav />
        <main
          id="main-content"
          className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8"
          aria-label="Konten utama"
        >
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
        <footer className="border-t bg-card/30 px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <span className="font-mono text-xs text-muted-foreground">
              © {new Date().getFullYear()} Orivastra
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Technology Beyond Horizons
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
