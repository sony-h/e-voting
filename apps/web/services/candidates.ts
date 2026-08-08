import { apiFetch } from '@/lib/api';
import type { Candidate, CandidateImage } from '@e-voting/types';

export type CandidateWithImages = Candidate & { images: CandidateImage[] };

export function listCandidates(electionId: string) {
  return apiFetch<CandidateWithImages[]>(`/candidates?electionId=${electionId}`);
}

export function listPublicCandidates(electionId: string) {
  return apiFetch<CandidateWithImages[]>(`/public/candidates?electionId=${electionId}`);
}

export function createCandidate(data: Partial<Candidate>) {
  return apiFetch<CandidateWithImages>('/candidates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateCandidate(id: string, data: Partial<Candidate>) {
  return apiFetch<CandidateWithImages>(`/candidates/${id}`, {
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
  return apiFetch<CandidateWithImages>(`/candidates/${id}/photo`, {
    method: 'POST',
    body: form,
  });
}

export function uploadCandidateImages(id: string, files: File[]) {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  return apiFetch<CandidateImage[]>(`/candidates/${id}/images`, {
    method: 'POST',
    body: form,
  });
}

export function deleteCandidateImage(imageId: string) {
  return apiFetch<{ message: string }>(`/candidate-images/${imageId}`, {
    method: 'DELETE',
  });
}
