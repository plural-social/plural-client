import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { ApiError } from '@/api/client';
import { listComments } from '@/api/comments';
import { listFeed, type FeedKind } from '@/api/feed';
import { getPost, listUserPosts } from '@/api/posts';
import { queryKeys } from '@/api/query-keys';
import type { Comment, Page, Post } from '@/api/types';

type InfinitePage<T> = UseInfiniteQueryResult<InfiniteData<Page<T>>, ApiError>;

// Every list endpoint pages the same way: start with no cursor, stop when the
// server leaves nextCursor out.
const pageOptions = {
  initialPageParam: null as string | null,
  getNextPageParam: (lastPage: Page<unknown>) => lastPage.nextCursor ?? undefined,
};

/** Infinite feed. kind 'following' requires sign-in, which the (app) group guarantees. */
export function useFeed(kind: FeedKind): InfinitePage<Post> {
  return useInfiniteQuery<Page<Post>, ApiError, InfiniteData<Page<Post>>, readonly unknown[], string | null>({
    queryKey: queryKeys.feed(kind),
    queryFn: ({ pageParam }) => listFeed(kind, pageParam),
    ...pageOptions,
  });
}

// While a video is still processing, lists and the detail screen poll so the
// post turns ready without a manual refresh.
const PROCESSING_POLL_MS = 4000;

const isProcessing = (post: Post): boolean => post.media.status === 'processing';

export function useUserPosts(username: string): InfinitePage<Post> {
  return useInfiniteQuery<Page<Post>, ApiError, InfiniteData<Page<Post>>, readonly unknown[], string | null>({
    queryKey: queryKeys.userPosts(username),
    queryFn: ({ pageParam }) => listUserPosts(username, pageParam),
    refetchInterval: (query) => (flattenPages(query.state.data).some(isProcessing) ? PROCESSING_POLL_MS : false),
    ...pageOptions,
  });
}

export function usePost(uuid: string): UseQueryResult<Post, ApiError> {
  return useQuery<Post, ApiError>({
    queryKey: queryKeys.post(uuid),
    queryFn: () => getPost(uuid),
    refetchInterval: (query) => (query.state.data && isProcessing(query.state.data) ? PROCESSING_POLL_MS : false),
  });
}

export function useComments(postUuid: string): InfinitePage<Comment> {
  return useInfiniteQuery<Page<Comment>, ApiError, InfiniteData<Page<Comment>>, readonly unknown[], string | null>({
    queryKey: queryKeys.comments(postUuid),
    queryFn: ({ pageParam }) => listComments(postUuid, pageParam),
    ...pageOptions,
  });
}

/** Flattens infinite pages into one array. */
export function flattenPages<T>(data: InfiniteData<Page<T>> | undefined): T[] {
  return data?.pages.flatMap((page) => page.items) ?? [];
}
