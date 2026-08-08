import type { ApiErrorResponse } from '@e-voting/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public errorCode: string,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const err = (body ?? {}) as Partial<ApiErrorResponse>;
    throw new ApiError(
      response.status,
      err.errorCode ?? 'UNKNOWN_ERROR',
      err.message ?? 'Request failed',
    );
  }

  return (body as { data: T }).data;
}
