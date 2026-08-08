import { apiFetch, apiFetchBlob } from '@/lib/api';
import type { Student, VotingToken } from '@e-voting/types';

export type StudentWithToken = Student & { token: VotingToken | null };

export interface ImportResult {
  imported: number;
  failed: number;
  total: number;
}

export function listStudents(electionId: string) {
  return apiFetch<StudentWithToken[]>(`/students?electionId=${electionId}`);
}

export function createStudent(data: Partial<Student>) {
  return apiFetch<StudentWithToken>('/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateStudent(id: string, data: Partial<Student>) {
  return apiFetch<StudentWithToken>(`/students/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteStudent(id: string) {
  return apiFetch<{ message: string }>(`/students/${id}`, { method: 'DELETE' });
}

export function resetStudentVote(id: string) {
  return apiFetch<StudentWithToken>(`/student-elections/${id}/reset`, { method: 'PATCH' });
}

export function resetStudentToken(id: string) {
  return apiFetch<VotingToken>(`/student-elections/${id}/token/reset`, { method: 'POST' });
}

export function importStudents(electionId: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<ImportResult>(`/students/import?electionId=${electionId}`, {
    method: 'POST',
    body: form,
  });
}

export async function exportStudents(electionId: string) {
  const blob = await apiFetchBlob(`/students/export?electionId=${electionId}`, {
    method: 'POST',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `students-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
