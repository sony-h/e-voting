'use client';

import { useEffect, useState } from 'react';

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}j ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}d`;
}

export function CountdownPill({ endAt }: { endAt: string | Date | null }) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!endAt) return;
    const interval = setInterval(() => {
      setRemaining(new Date(endAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [endAt]);

  if (!endAt || remaining <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 font-mono text-xs text-muted-foreground">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
      Sisa waktu {formatRemaining(remaining)}
    </span>
  );
}
