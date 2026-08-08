import { apiFetch } from '@/lib/api';
import type { Candidate } from '@e-voting/types';

export interface VotingStatus {
  has_voted: boolean;
  electionId: string;
  election_status: string;
}

export function getVotingCandidates() {
  return apiFetch<Candidate[]>('/voting/candidates');
}

export function getVotingStatus() {
  return apiFetch<VotingStatus>('/voting/status');
}

export function submitVote(candidateId: string) {
  return apiFetch<{ message: string }>('/voting/submit', {
    method: 'POST',
    body: JSON.stringify({ candidateId }),
  });
}
