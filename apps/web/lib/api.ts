import type { ApiErrorResponse } from '@e-voting/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const API_BASE_URL = BASE_URL;

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
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: isFormData
      ? options.headers
      : { 'Content-Type': 'application/json', ...options.headers },
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

export async function apiFetchBlob(path: string, options: RequestInit = {}): Promise<Blob> {
  const response = await fetch(`${BASE_URL}${path}`, { ...options, credentials: 'include' });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      (body as Partial<ApiErrorResponse>)?.errorCode ?? 'UNKNOWN_ERROR',
      (body as Partial<ApiErrorResponse>)?.message ?? 'Request failed',
    );
  }
  return response.blob();
}
