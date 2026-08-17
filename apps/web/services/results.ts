import { apiFetch, apiFetchBlob } from '@/lib/api';

export interface ResultCandidate {
  candidateNumber: number;
  chairman_name: string;
  vice_chairman_name: string | null;
  votes: number;
  percentage: number;
}

export interface ElectionResults {
  election: {
    title: string;
    academic_year: string;
    status: string;
    results_public: boolean;
  };
  total_votes: number;
  candidates: ResultCandidate[];
}

export function getResults(electionId: string) {
  return apiFetch<ElectionResults>(`/results?electionId=${electionId}`);
}

export function getPublicResults(electionId: string) {
  return apiFetch<ElectionResults>(`/public/results?electionId=${electionId}`);
}

export function publishResults(electionId: string, visible: boolean) {
  return apiFetch<{ results_public: boolean }>('/results/publish', {
    method: 'POST',
    body: JSON.stringify({ electionId, visible }),
  });
}

export async function exportResultsExcel(electionId: string) {
  const blob = await apiFetchBlob(`/results/export/excel?electionId=${electionId}`);
  downloadBlob(blob, `hasil-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function exportResultsPdf(electionId: string) {
  const blob = await apiFetchBlob(`/results/export/pdf?electionId=${electionId}`);
  downloadBlob(blob, `hasil-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
