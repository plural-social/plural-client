/**
 * One post can be cached in several places at once: a feed page, a profile
 * grid page and its detail query. These helpers keep every copy in sync, so a
 * like on the feed shows on the detail screen without a refetch.
 */
import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys';
import type { Page, Post } from '@/api/types';

// Query key prefixes of every infinite list that holds posts.
const POST_LIST_PREFIXES = [['feed'], ['userPosts']] as const;

type PostPages = InfiniteData<Page<Post>>;

/** Maps every page of a cached list. Returns the same object when nothing changed, so React Query skips re-renders. */
function mapPages(data: PostPages | undefined, mapItems: (items: Post[]) => Post[]): PostPages | undefined {
  if (!data) return data;
  let changed = false;
  const pages = data.pages.map((page) => {
    const items = mapItems(page.items);
    if (items === page.items) return page;
    changed = true;
    return { ...page, items };
  });
  return changed ? { ...data, pages } : data;
}

/**
 * Applies updater to every cached copy of the post: feeds, user post lists and
 * the post detail query.
 */
export function updatePostInCaches(queryClient: QueryClient, postUuid: string, updater: (post: Post) => Post): void {
  const mapItems = (items: Post[]): Post[] =>
    items.some((post) => post.uuid === postUuid)
      ? items.map((post) => (post.uuid === postUuid ? updater(post) : post))
      : items;

  for (const queryKey of POST_LIST_PREFIXES) {
    queryClient.setQueriesData<PostPages>({ queryKey }, (data) => mapPages(data, mapItems));
  }
  queryClient.setQueryData<Post>(queryKeys.post(postUuid), (post) => (post ? updater(post) : post));
}

/** Removes the post from feeds and user post lists, and removes its detail query. */
export function removePostFromCaches(queryClient: QueryClient, postUuid: string): void {
  const mapItems = (items: Post[]): Post[] =>
    items.some((post) => post.uuid === postUuid) ? items.filter((post) => post.uuid !== postUuid) : items;

  for (const queryKey of POST_LIST_PREFIXES) {
    queryClient.setQueriesData<PostPages>({ queryKey }, (data) => mapPages(data, mapItems));
  }
  queryClient.removeQueries({ queryKey: queryKeys.post(postUuid) });
}

/** Refetches every query that holds posts. Use after an optimistic update fails. */
export async function invalidatePostQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    ...POST_LIST_PREFIXES.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    queryClient.invalidateQueries({ queryKey: ['post'] }),
  ]);
}
