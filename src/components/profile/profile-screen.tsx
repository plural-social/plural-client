import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { Profile } from '@/api/types';
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
import { useUserPosts } from '@/hooks/use-post-queries';

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
