import { apiFetch } from '@/lib/api';
import type { Candidate } from '@e-voting/types';

export function listCandidates(electionId: string) {
  return apiFetch<Candidate[]>(`/candidates?electionId=${electionId}`);
}

export function createCandidate(data: Partial<Candidate>) {
  return apiFetch<Candidate>('/candidates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateCandidate(id: string, data: Partial<Candidate>) {
  return apiFetch<Candidate>(`/candidates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteCandidate(id: string) {
  return apiFetch<{ message: string }>(`/candidates/${id}`, { method: 'DELETE' });
}

export function uploadCandidatePhoto(id: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<Candidate>(`/candidates/${id}/photo`, {
    method: 'POST',
    body: form,
  });
}
