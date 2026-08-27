export enum ElectionStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export interface Election {
  id: string;
  title: string;
  description: string | null;
  academic_year: string;
  status: ElectionStatus;
  start_at: Date | null;
  end_at: Date | null;
  order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Student {
  id: string;
  election_id: string;
  nis: string;
  nisn: string | null;
  full_name: string;
  class_name: string;
  major: string | null;
  grade: string | null;
  has_voted: boolean;
  voted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type CandidateImageType = 'PROGRAM' | 'PHOTO' | 'POSTER';

export interface Candidate {
  id: string;
  election_id: string;
  candidate_number: number;
  chairman_name: string;
  vice_chairman_name: string | null;
  vision: string;
  mission: string;
  program_description: string | null;
  show_on_landing: boolean;
  created_at: Date;
  updated_at: Date;
  images?: CandidateImage[];
}

export interface CandidateImage {
  id: string;
  candidate_id: string;
  url: string;
  caption: string | null;
  sort_order: number;
  type: CandidateImageType;
  created_at: Date;
}

export enum StaffRole {
  TEACHER = 'TEACHER',
  STAFF = 'STAFF',
}

export interface StaffVoter {
  id: string;
  election_id: string;
  nip: string | null;
  username: string | null;
  full_name: string;
  role: StaffRole;
  has_voted: boolean;
  voted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  token?: VotingToken | null;
}

export interface VotingToken {
  id: string;
  election_id: string;
  student_id: string | null;
  staff_id: string | null;
  token: string;
  is_used: boolean;
  expires_at: Date | null;
  created_at: Date;
}

export interface Vote {
  id: string;
  election_id: string;
  candidate_id: string;
  created_at: Date;
}

export interface AuditLog {
  id: string;
  actor_type: string;
  actor_id: string | null;
  action: string;
  entity: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface Settings {
  id: number;
  school_name: string | null;
  school_logo: string | null;
  principal_name: string | null;
  current_academic_year: string | null;
  updated_at: Date;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode: string;
}
