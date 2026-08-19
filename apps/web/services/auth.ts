import { apiFetch } from '@/lib/api';

export interface AdminProfile {
  id: string;
  username: string;
  full_name: string | null;
}

export interface StudentSession {
  studentId: string;
  nis: string;
  elections: {
    electionId: string;
    studentId: string;
    has_voted: boolean;
  }[];
  expiresAt: string;
}

export interface StudentLoginResult {
  expiresAt: string;
  student: {
    full_name: string;
    class_name: string;
  };
}

export function adminLogin(username: string, password: string) {
  return apiFetch<AdminProfile>('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function adminLogout() {
  return apiFetch<{ message: string }>('/auth/admin/logout', { method: 'POST' });
}

export function adminProfile() {
  return apiFetch<AdminProfile>('/auth/admin/profile');
}

export function studentLogin(identifier: string, token: string) {
  return apiFetch<StudentLoginResult>('/auth/student/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, token }),
  });
}

export function studentLogout() {
  return apiFetch<{ message: string }>('/auth/student/logout', { method: 'POST' });
}

export function studentSession() {
  return apiFetch<StudentSession>('/auth/student/session');
}
