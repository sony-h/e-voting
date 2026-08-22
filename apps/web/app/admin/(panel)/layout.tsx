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
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main
          id="main-content"
          className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8"
          aria-label="Konten utama"
        >
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
