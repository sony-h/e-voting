import { apiFetch } from '@/lib/api';
import type { Candidate } from '@e-voting/types';

export interface VotingElection {
  electionId: string;
  studentId: string;
  has_voted: boolean;
  title?: string;
}

export interface VotingStatus {
  has_voted: boolean;
  electionId: string;
  election_status: string;
  elections: VotingElection[];
}

export interface SubmitVoteResult {
  message: string;
  next: { electionId: string } | null;
}

export function getVotingCandidates() {
  return apiFetch<Candidate[]>('/voting/candidates');
}

export function getVotingStatus() {
  return apiFetch<VotingStatus>('/voting/status');
}

export function submitVote(candidateId: string) {
  return apiFetch<SubmitVoteResult>('/voting/submit', {
    method: 'POST',
    body: JSON.stringify({ candidateId }),
  });
}
