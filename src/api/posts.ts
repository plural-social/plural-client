import { apiFetch } from '@/api/client';
import type { Page, Post } from '@/api/types';

export async function createPost(input: { mediaUuid: string; caption: string }): Promise<Post> {
  return apiFetch<Post>('/posts', { method: 'POST', json: input });
}

export async function getPost(uuid: string): Promise<Post> {
  return apiFetch<Post>(`/posts/${encodeURIComponent(uuid)}`);
}

export async function deletePost(uuid: string): Promise<void> {
  await apiFetch<void>(`/posts/${encodeURIComponent(uuid)}`, { method: 'DELETE' });
}

export async function listUserPosts(username: string, cursor: string | null): Promise<Page<Post>> {
  return apiFetch<Page<Post>>(`/users/${encodeURIComponent(username)}/posts`, {
    query: { cursor: cursor ?? undefined },
  });
}
