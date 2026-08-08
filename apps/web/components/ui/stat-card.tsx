import { cn } from '@/lib/utils';

type Accent = 'default' | 'green' | 'orange' | 'blue';

const ACCENT_CLASS: Record<Accent, string> = {
  default: 'text-foreground',
  green: 'text-success',
  orange: 'text-orange-500',
  blue: 'text-primary',
};

export function StatCard({
  label,
  value,
  accent = 'default',
  className,
}: {
  label: string;
  value: string | number;
  accent?: Accent;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border bg-card p-6 shadow-sm', className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn('mt-2 text-3xl font-bold', ACCENT_CLASS[accent])}>{value}</p>
    </div>
  );
}
