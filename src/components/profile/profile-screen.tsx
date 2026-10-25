import { useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { Page, Post, Profile } from '@/api/types';
import { getProfile } from '@/api/users';
import { PostGrid } from '@/components/profile/post-grid';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ErrorView } from '@/components/ui/error-view';
import { LoadingView } from '@/components/ui/loading-view';
import { Spacing } from '@/constants/theme';
import { useBlockUser } from '@/hooks/use-moderation';
import { flattenPages, useUserPosts } from '@/hooks/use-post-queries';

type ProfileScreenProps = {
  username: string;
  /** Builds the header buttons once the profile has loaded. */
  renderActions: (profile: Profile) => React.ReactNode;
};

/** A profile header above the user's post grid, with loading, error and pull-to-refresh states. */
export function ProfileScreen({ username, renderActions }: ProfileScreenProps): React.JSX.Element {
  const profile = useQuery({
    queryKey: queryKeys.profile(username),
    queryFn: () => getProfile(username),
  });
  const posts = useUserPosts(username);
  useRefreshFeedsWhenProcessed(posts.data);

  if (profile.error) {
    if (profile.error instanceof ApiError && profile.error.status === 404) {
      return <ErrorView message="This account doesn't exist." />;
    }
    return <ErrorView message={profile.error.message} onRetry={() => void profile.refetch()} />;
  }
  if (profile.isPending) return <LoadingView />;

  const header = <ProfileHeader profile={profile.data} actions={renderActions(profile.data)} />;

  if (profile.data.isBlocked) {
    return (
      <ThemedView style={styles.fill}>
        <ScrollView>
          {header}
          <BlockedNotice profile={profile.data} />
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.fill}>
      <PostGrid
        query={posts}
        header={header}
        onRefresh={() => void profile.refetch()}
      />
    </ThemedView>
  );
}

/**
 * Feeds only include ready posts. When a video on this profile finishes
 * processing, the cached feeds are missing it, so they refetch once.
 */
function useRefreshFeedsWhenProcessed(data: InfiniteData<Page<Post>> | undefined): void {
  const queryClient = useQueryClient();
  const processing = new Set(
    flattenPages(data)
      .filter((post) => post.media.status === 'processing')
      .map((post) => post.uuid),
  );
  const processingKey = [...processing].sort().join(',');
  const previous = useRef<Set<string>>(new Set());

  useEffect(() => {
    const current = new Set(processingKey ? processingKey.split(',') : []);
    const finished = [...previous.current].some((uuid) => !current.has(uuid));
    previous.current = current;
    if (finished) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed('following') });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed('explore') });
    }
  }, [processingKey, queryClient]);
}

/** Shown instead of the post grid on a profile the viewer blocked. */
function BlockedNotice({ profile }: { profile: Profile }): React.JSX.Element {
  const { unblock } = useBlockUser();
  return (
    <View style={styles.blocked}>
      <ThemedText themeColor="textSecondary">You blocked @{profile.username}.</ThemedText>
      <Button label="Unblock" variant="secondary" onPress={() => void unblock(profile)} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  blocked: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
});
