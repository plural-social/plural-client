import { apiFetch } from '@/api/client';
import type { SessionResponse } from '@/api/types';

export async function createSession(input: { login: string; password: string }): Promise<SessionResponse> {
  return apiFetch<SessionResponse>('/sessions', { method: 'POST', json: input });
}

export async function deleteCurrentSession(): Promise<void> {
  await apiFetch<void>('/sessions/current', { method: 'DELETE' });
}
