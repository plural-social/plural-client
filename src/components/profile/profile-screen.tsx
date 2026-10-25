import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { Profile } from '@/api/types';
import { getProfile } from '@/api/users';
import { PostGrid } from '@/components/profile/post-grid';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ThemedView } from '@/components/themed-view';
import { ErrorView } from '@/components/ui/error-view';
import { LoadingView } from '@/components/ui/loading-view';
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

  return (
    <ThemedView style={{ flex: 1 }}>
      <PostGrid
        query={posts}
        header={<ProfileHeader profile={profile.data} actions={renderActions(profile.data)} />}
        onRefresh={() => void profile.refetch()}
      />
    </ThemedView>
  );
}
