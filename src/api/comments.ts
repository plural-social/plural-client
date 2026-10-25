import { apiFetch } from '@/api/client';
import type { Comment, Page } from '@/api/types';

export async function listComments(postUuid: string, cursor: string | null): Promise<Page<Comment>> {
  return apiFetch<Page<Comment>>(`/posts/${encodeURIComponent(postUuid)}/comments`, {
    query: { cursor: cursor ?? undefined },
  });
}

export async function createComment(postUuid: string, body: string): Promise<Comment> {
  return apiFetch<Comment>(`/posts/${encodeURIComponent(postUuid)}/comments`, { method: 'POST', json: { body } });
}

export async function deleteComment(uuid: string): Promise<void> {
  await apiFetch<void>(`/comments/${encodeURIComponent(uuid)}`, { method: 'DELETE' });
}
