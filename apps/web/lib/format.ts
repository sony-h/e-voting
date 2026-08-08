import type { Election } from '@e-voting/types';

export function formatPeriod(election: Election): string {
  if (!election.start_at && !election.end_at) return 'Waktu akan diumumkan';
  const start = election.start_at ? new Date(election.start_at).toLocaleDateString('id-ID') : 'TBA';
  const end = election.end_at ? new Date(election.end_at).toLocaleDateString('id-ID') : 'TBA';
  return `${start} — ${end}`;
}
