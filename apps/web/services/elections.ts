import { apiFetch } from '@/lib/api';
import type { Election } from '@e-voting/types';

export function listElections() {
  return apiFetch<Election[]>('/elections');
}

export function getElection(id: string) {
  return apiFetch<Election>(`/elections/${id}`);
}

export function createElection(data: {
  title: string;
  description?: string;
  academic_year: string;
  start_at?: string;
  end_at?: string;
}) {
  return apiFetch<Election>('/elections', { method: 'POST', body: JSON.stringify(data) });
}

export function updateElection(
  id: string,
  data: {
    title?: string;
    description?: string;
    academic_year?: string;
    start_at?: string;
    end_at?: string;
  },
) {
  return apiFetch<Election>(`/elections/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function startElection(id: string) {
  return apiFetch<Election>(`/elections/${id}/start`, { method: 'POST' });
}

export function closeElection(id: string) {
  return apiFetch<Election>(`/elections/${id}/close`, { method: 'POST' });
}
