import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { useRef } from 'react';

import type { ApiError } from '@/api/client';
import { createComment, deleteComment } from '@/api/comments';
import { follow, unfollow } from '@/api/follows';
import { likePost, unlikePost } from '@/api/likes';
import { invalidatePostQueries, removePostFromCaches, updatePostInCaches } from '@/api/post-cache';
import { deletePost } from '@/api/posts';
import { queryKeys } from '@/api/query-keys';
import type { Comment, Post, Profile } from '@/api/types';
import { useMe } from '@/auth/session-context';

/** Optimistic like toggle: the heart flips at once and reverts if the request fails. */
export function useToggleLike(): (post: Post) => void {
  const queryClient = useQueryClient();
  // Taps while a request for the same post is in flight are ignored, so fast
  // double taps cannot leave the cache and the server out of sync.
  const inFlight = useRef(new Set<string>());

  return (post: Post) => {
    if (inFlight.current.has(post.uuid)) return;
    inFlight.current.add(post.uuid);

    const liked = !post.likedByMe;
    const setLiked = (value: boolean): void =>
      updatePostInCaches(queryClient, post.uuid, (cached) =>
        cached.likedByMe === value
          ? cached
          : { ...cached, likedByMe: value, likeCount: cached.likeCount + (value ? 1 : -1) },
      );
    setLiked(liked);

    void (async () => {
      try {
        await (liked ? likePost(post.uuid) : unlikePost(post.uuid));
      } catch {
        // Roll back first: the refetch below fails too when the network is down.
        setLiked(!liked);
        await invalidatePostQueries(queryClient);
      } finally {
        inFlight.current.delete(post.uuid);
      }
    })();
  };
}

export function useDeletePost(): UseMutationResult<void, ApiError, string> {
  const queryClient = useQueryClient();
  const me = useMe();
  return useMutation<void, ApiError, string>({
    mutationFn: deletePost,
    onSuccess: async (_, postUuid) => {
      removePostFromCaches(queryClient, postUuid);
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile(me.username) });
    },
  });
}

/** Adds the delta to the post's comment count in every cache. */
function adjustCommentCount(queryClient: ReturnType<typeof useQueryClient>, postUuid: string, delta: number): void {
  updatePostInCaches(queryClient, postUuid, (post) => ({ ...post, commentCount: post.commentCount + delta }));
}

export function useCreateComment(postUuid: string): UseMutationResult<Comment, ApiError, string> {
  const queryClient = useQueryClient();
  return useMutation<Comment, ApiError, string>({
    mutationFn: (body) => createComment(postUuid, body),
    onSuccess: async () => {
      adjustCommentCount(queryClient, postUuid, 1);
      await queryClient.invalidateQueries({ queryKey: queryKeys.comments(postUuid) });
    },
  });
}

export function useDeleteComment(postUuid: string): UseMutationResult<void, ApiError, string> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: deleteComment,
    onSuccess: async () => {
      adjustCommentCount(queryClient, postUuid, -1);
      await queryClient.invalidateQueries({ queryKey: queryKeys.comments(postUuid) });
    },
  });
}

/**
 * Optimistic follow toggle on the profile; the Following feed refetches
 * afterwards. onError receives the failure after the toggle is rolled back.
 */
export function useToggleFollow(): (profile: Profile, onError?: (error: unknown) => void) => void {
  const queryClient = useQueryClient();

  return (profile, onError) => {
    const following = !profile.isFollowing;
    const profileKey = queryKeys.profile(profile.username);
    const setFollowing = (value: boolean): void => {
      queryClient.setQueryData<Profile>(profileKey, (cached) =>
        cached && cached.isFollowing !== value
          ? { ...cached, isFollowing: value, followerCount: cached.followerCount + (value ? 1 : -1) }
          : cached,
      );
    };
    setFollowing(following);

    void (async () => {
      try {
        await (following ? follow(profile.username) : unfollow(profile.username));
      } catch (error) {
        setFollowing(!following);
        onError?.(error);
        await queryClient.invalidateQueries({ queryKey: profileKey });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.feed('following') });
    })();
  };
}
