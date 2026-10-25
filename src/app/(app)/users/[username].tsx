import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable } from 'react-native';

import { queryKeys } from '@/api/query-keys';
import type { Profile } from '@/api/types';
import { getProfile } from '@/api/users';
import { FollowButton } from '@/components/profile/follow-button';
import { ProfileScreen } from '@/components/profile/profile-screen';
import { Button } from '@/components/ui/button';
import { useActionMenu } from '@/hooks/use-action-menu';
import { useBlockUser } from '@/hooks/use-moderation';
import { useReportSheet } from '@/hooks/use-report-sheet';
import { useTheme } from '@/hooks/use-theme';

export default function UserScreen(): React.JSX.Element {
  const { username } = useLocalSearchParams<{ username: string }>();
  // Same query as ProfileScreen, so this reads the cached profile.
  const { data: profile } = useQuery({ queryKey: queryKeys.profile(username), queryFn: () => getProfile(username) });

  return (
    <>
      <Stack.Screen
        options={{
          title: `@${username}`,
          headerRight: () => (profile && !profile.isSelf ? <ProfileMenuButton profile={profile} /> : null),
        }}
      />
      <ProfileScreen
        username={username}
        renderActions={(loaded) => {
          if (loaded.isSelf) {
            return <Button label="Edit profile" variant="secondary" onPress={() => router.push('/settings/edit-profile')} />;
          }
          return loaded.isBlocked ? null : <FollowButton profile={loaded} />;
        }}
      />
    </>
  );
}

/** Header "…" button with Block/Unblock and Report for someone else's profile. */
function ProfileMenuButton({ profile }: { profile: Profile }): React.JSX.Element {
  const theme = useTheme();
  const { open, menu } = useActionMenu();
  const report = useReportSheet();
  const { block, unblock } = useBlockUser();

  function openMenu(): void {
    open([
      profile.isBlocked
        ? { label: `Unblock @${profile.username}`, onPress: () => void unblock(profile) }
        : { label: `Block @${profile.username}`, destructive: true, onPress: () => void block(profile) },
      {
        label: `Report @${profile.username}`,
        onPress: () => report.open({ type: 'account', uuid: profile.uuid, label: `@${profile.username}` }),
      },
    ]);
  }

  return (
    <>
      <Pressable
        onPress={openMenu}
        accessibilityRole="button"
        accessibilityLabel={`More options for @${profile.username}`}
        hitSlop={8}
        style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="ellipsis-horizontal" size={22} color={theme.text} />
      </Pressable>
      {menu}
      {report.sheet}
    </>
  );
}
