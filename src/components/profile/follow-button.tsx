import type { Profile } from '@/api/types';
import { Button } from '@/components/ui/button';
import { useToggleFollow } from '@/hooks/use-post-mutations';

export function FollowButton({ profile }: { profile: Profile }): React.JSX.Element {
  const toggleFollow = useToggleFollow();
  return (
    <Button
      label={profile.isFollowing ? 'Following' : 'Follow'}
      variant={profile.isFollowing ? 'secondary' : 'primary'}
      onPress={() => toggleFollow(profile)}
    />
  );
}
