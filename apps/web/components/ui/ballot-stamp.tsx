import { cn } from '@/lib/utils';

export type BallotStatus = 'ACTIVE' | 'SCHEDULED' | 'CLOSED' | 'DRAFT';

const STATUS_META: Record<BallotStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Sedang Berlangsung',
    className: 'border-success/50 text-success',
  },
  SCHEDULED: {
    label: 'Segera',
    className: 'border-primary/50 text-primary',
  },
  CLOSED: {
    label: 'Selesai',
    className: 'border-border text-muted-foreground',
  },
  DRAFT: {
    label: 'Draft',
    className: 'border-border text-muted-foreground',
  },
};

export function BallotStamp({ status, className }: { status: BallotStatus; className?: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.DRAFT;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border-2 border-dashed px-3 py-1 text-xs font-semibold tracking-wide',
        meta.className,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}
