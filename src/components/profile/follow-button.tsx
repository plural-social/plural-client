import { useState } from 'react';
import { View } from 'react-native';

import { ApiError } from '@/api/client';
import type { Profile } from '@/api/types';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { useToggleFollow } from '@/hooks/use-post-mutations';

export function FollowButton({ profile }: { profile: Profile }): React.JSX.Element {
  const toggleFollow = useToggleFollow();
  const [error, setError] = useState<string>();

  function handlePress(): void {
    setError(undefined);
    toggleFollow(profile, (followError) =>
      setError(
        followError instanceof ApiError && followError.type === 'blocked'
          ? "You can't follow this account."
          : 'Something went wrong. Try again.',
      ),
    );
  }

  return (
    <View>
      <Button
        label={profile.isFollowing ? 'Following' : 'Follow'}
        variant={profile.isFollowing ? 'secondary' : 'primary'}
        onPress={handlePress}
      />
      <FormError message={error} />
    </View>
  );
}
