import { router } from 'expo-router';

import { useMe, useSession } from '@/auth/session-context';
import { ProfileScreen } from '@/components/profile/profile-screen';
import { Button } from '@/components/ui/button';

export default function MyProfileScreen(): React.JSX.Element {
  const me = useMe();
  const { signOut } = useSession();

  return (
    <ProfileScreen
      username={me.username}
      renderActions={() => (
        <>
          <Button label="Edit profile" variant="secondary" onPress={() => router.push('/settings/edit-profile')} />
          <Button label="Sign out" variant="secondary" onPress={() => void signOut()} />
        </>
      )}
    />
  );
}
