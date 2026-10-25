import { apiFetch } from '@/api/client';

export async function follow(username: string): Promise<void> {
  await apiFetch<void>(`/users/${encodeURIComponent(username)}/follow`, { method: 'PUT' });
}

export async function unfollow(username: string): Promise<void> {
  await apiFetch<void>(`/users/${encodeURIComponent(username)}/follow`, { method: 'DELETE' });
}
