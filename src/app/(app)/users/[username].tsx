import { router, Stack, useLocalSearchParams } from 'expo-router';

import { FollowButton } from '@/components/profile/follow-button';
import { ProfileScreen } from '@/components/profile/profile-screen';
import { Button } from '@/components/ui/button';

export default function UserScreen(): React.JSX.Element {
  const { username } = useLocalSearchParams<{ username: string }>();

  return (
    <>
      <Stack.Screen options={{ title: `@${username}` }} />
      <ProfileScreen
        username={username}
        renderActions={(profile) =>
          profile.isSelf ? (
            <Button label="Edit profile" variant="secondary" onPress={() => router.push('/settings/edit-profile')} />
          ) : (
            <FollowButton profile={profile} />
          )
        }
      />
    </>
  );
}
