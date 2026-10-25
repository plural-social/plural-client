import { apiFetch } from '@/api/client';
import type { Profile } from '@/api/types';

export async function getProfile(username: string): Promise<Profile> {
  return apiFetch<Profile>(`/users/${encodeURIComponent(username)}`);
}
