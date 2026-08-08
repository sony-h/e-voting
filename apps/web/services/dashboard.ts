import { apiFetch } from '@/lib/api';

export interface DashboardSummary {
  total_students: number;
  already_voted: number;
  not_voted: number;
  total_votes: number;
  participation_rate: number;
  status: string;
}

export interface ParticipationGroup {
  name: string;
  total: number;
  voted: number;
  participation_rate: number;
}

export function getDashboardSummary(electionId: string) {
  return apiFetch<DashboardSummary>(`/dashboard/summary?electionId=${electionId}`);
}

export function getDashboardClasses(electionId: string) {
  return apiFetch<ParticipationGroup[]>(`/dashboard/classes?electionId=${electionId}`);
}

export function getDashboardMajors(electionId: string) {
  return apiFetch<ParticipationGroup[]>(`/dashboard/majors?electionId=${electionId}`);
}
