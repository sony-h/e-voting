import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Providers } from '@/components/providers';
import './globals.css';

const geistSans = localFont({
  src: './fonts/Geist-Variable.woff2',
  variable: '--font-sans',
  display: 'swap',
});

const geistMono = localFont({
  src: './fonts/GeistMono-Variable.woff2',
  variable: '--font-geist-mono',
  display: 'swap',
});

const sourceSerif4 = localFont({
  src: './fonts/SourceSerif4-Variable.woff2',
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'E-Voting - Orivastra',
    template: '%s | E-Voting - Orivastra',
  },
  description:
    'E-Voting OSIS & MPK — SMA N 1 Wonosobo, crafted by Orivastra. From Origin to the Stars. Technology Beyond Horizons.',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif4.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
