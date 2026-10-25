import { StyleSheet, View } from 'react-native';

import type { Profile } from '@/api/types';
import { Avatar } from '@/components/profile/avatar';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type ProfileHeaderProps = {
  profile: Profile;
  /** Buttons for this screen, e.g. "Edit profile" or "Follow". */
  actions: React.ReactNode;
};

const AVATAR_SIZE = 96;

export function ProfileHeader({ profile, actions }: ProfileHeaderProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Avatar user={profile} size={AVATAR_SIZE} />
      {profile.displayName ? (
        <ThemedText type="subtitle" style={styles.centered}>
          {profile.displayName}
        </ThemedText>
      ) : null}
      <ThemedText themeColor="textSecondary">@{profile.username}</ThemedText>
      {profile.bio ? <ThemedText style={styles.centered}>{profile.bio}</ThemedText> : null}
      <View style={styles.counts}>
        <Count value={profile.postCount} singular="post" plural="posts" label="Posts" />
        <Count value={profile.followerCount} singular="follower" plural="followers" label="Followers" />
        <Count value={profile.followingCount} singular="following" plural="following" label="Following" />
      </View>
      <View style={styles.actions}>{actions}</View>
    </View>
  );
}

type CountProps = {
  value: number;
  singular: string;
  plural: string;
  label: string;
};

function Count({ value, singular, plural, label }: CountProps): React.JSX.Element {
  return (
    <View
      style={styles.count}
      accessible
      accessibilityLabel={`${value} ${value === 1 ? singular : plural}`}>
      <ThemedText type="smallBold">{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  centered: {
    textAlign: 'center',
  },
  counts: {
    flexDirection: 'row',
    gap: Spacing.five,
    marginVertical: Spacing.two,
  },
  count: {
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
