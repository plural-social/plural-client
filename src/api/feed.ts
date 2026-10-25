import { apiFetch } from '@/api/client';
import type { Page, Post } from '@/api/types';

export type FeedKind = 'following' | 'explore';

export async function listFeed(kind: FeedKind, cursor: string | null): Promise<Page<Post>> {
  return apiFetch<Page<Post>>(`/feed/${kind}`, { query: { cursor: cursor ?? undefined } });
}
