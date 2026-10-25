import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView } from 'react-native';

import { ApiError } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { Profile } from '@/api/types';
import { getProfile } from '@/api/users';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ThemedView } from '@/components/themed-view';
import { ErrorView } from '@/components/ui/error-view';
import { LoadingView } from '@/components/ui/loading-view';

type ProfileScreenProps = {
  username: string;
  /** Builds the header buttons once the profile has loaded. */
  renderActions: (profile: Profile) => React.ReactNode;
};

/** Loads a profile and renders it with loading, error and pull-to-refresh states. */
export function ProfileScreen({ username, renderActions }: ProfileScreenProps): React.JSX.Element {
  const { data, error, isPending, isRefetching, refetch } = useQuery({
    queryKey: queryKeys.profile(username),
    queryFn: () => getProfile(username),
  });

  if (error) {
    if (error instanceof ApiError && error.status === 404) {
      return <ErrorView message="This account doesn't exist." />;
    }
    return <ErrorView message={error.message} onRetry={() => void refetch()} />;
  }
  if (isPending) return <LoadingView />;

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}>
        <ProfileHeader profile={data} actions={renderActions(data)} />
      </ScrollView>
    </ThemedView>
  );
}
