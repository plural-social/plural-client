import { apiFetch } from '@/api/client';

export async function likePost(uuid: string): Promise<void> {
  await apiFetch<void>(`/posts/${encodeURIComponent(uuid)}/like`, { method: 'PUT' });
}

export async function unlikePost(uuid: string): Promise<void> {
  await apiFetch<void>(`/posts/${encodeURIComponent(uuid)}/like`, { method: 'DELETE' });
}
