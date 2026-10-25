import { apiFetch } from '@/api/client';
import type { Me } from '@/api/types';

export async function getMe(): Promise<Me> {
  return apiFetch<Me>('/me');
}

export async function updateMe(input: { displayName?: string; bio?: string }): Promise<Me> {
  return apiFetch<Me>('/me', { method: 'PATCH', json: input });
}

export async function setAvatar(mediaUuid: string): Promise<Me> {
  return apiFetch<Me>('/me/avatar', { method: 'PUT', json: { mediaUuid } });
}

export async function removeAvatar(): Promise<Me> {
  return apiFetch<Me>('/me/avatar', { method: 'DELETE' });
}

/** Permanently deletes the account and everything it owns. The password confirms it is really the owner. */
export async function deleteMe(password: string): Promise<void> {
  await apiFetch<void>('/me', { method: 'DELETE', json: { password } });
}
