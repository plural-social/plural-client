import { apiFetch } from '@/api/client';
import type { Me } from '@/api/types';

export async function getMe(): Promise<Me> {
  return apiFetch<Me>('/me');
}

export async function updateMe(input: { displayName?: string; bio?: string }): Promise<Me> {
  return apiFetch<Me>('/me', { method: 'PATCH', json: input });
}
