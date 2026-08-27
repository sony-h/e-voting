import { apiFetch, apiFetchBlob } from '@/lib/api';
import type { StaffRole, StaffVoter } from '@e-voting/types';

export interface PublicStaffItem {
  id: string;
  nip: string | null;
  username: string | null;
  full_name: string;
  role: StaffRole;
  election_id: string;
}

export function listStaff(electionId: string) {
  return apiFetch<StaffVoter[]>(`/staff?electionId=${electionId}`);
}

export function listPublicStaff(electionId?: string) {
  return apiFetch<PublicStaffItem[]>(
    electionId ? `/public/staff?electionId=${electionId}` : '/public/staff',
  );
}

export function getStaff(id: string) {
  return apiFetch<StaffVoter>(`/staff/${id}`);
}

export function createStaff(data: {
  election_id: string;
  nip?: string;
  username?: string;
  full_name: string;
  role?: StaffRole;
}) {
  return apiFetch<StaffVoter>('/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateStaff(
  id: string,
  data: {
    nip?: string;
    username?: string;
    full_name?: string;
    role?: StaffRole;
  },
) {
  return apiFetch<StaffVoter>(`/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteStaff(id: string) {
  return apiFetch<{ message: string }>(`/staff/${id}`, { method: 'DELETE' });
}

export function resetStaffToken(id: string) {
  return apiFetch<{ token: string }>(`/staff/${id}/reset-token`, { method: 'POST' });
}

export function resetStaffVote(id: string) {
  return apiFetch<StaffVoter>(`/staff/${id}/reset-vote`, { method: 'POST' });
}

export function importStaff(electionId: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<{ imported: number; failed: number; total: number }>(
    `/staff/import?electionId=${electionId}`,
    {
      method: 'POST',
      body: form,
    },
  );
}

export function exportStaff(electionId: string) {
  return apiFetchBlob(`/staff/export?electionId=${electionId}`).then((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guru-staf-${Date.now()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
