import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import type { UserSummary } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type AvatarProps = {
  user: UserSummary;
  size: number;
};

/** Round avatar image, or the user's initial when there is no image. */
export function Avatar({ user, size }: AvatarProps): React.JSX.Element {
  const theme = useTheme();
  const name = user.displayName || user.username;
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (user.avatarUrl) {
    return (
      <Image
        source={user.avatarUrl}
        style={shape}
        contentFit="cover"
        accessibilityLabel={`${name}'s avatar`}
      />
    );
  }

  return (
    <View
      style={[styles.fallback, shape, { backgroundColor: theme.backgroundSelected }]}
      accessibilityLabel={`${name}'s avatar`}
      accessibilityRole="image">
      <ThemedText style={{ fontSize: size * 0.4, lineHeight: size * 0.5 }}>
        {name.charAt(0).toUpperCase()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
