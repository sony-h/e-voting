import { API_BASE_URL } from '@/lib/api';

export const UPLOADS_BASE = API_BASE_URL.replace('/api/v1', '');

export function uploadUrl(path: string | null): string | null {
  if (!path) return null;
  return `${UPLOADS_BASE}${path}`;
}
