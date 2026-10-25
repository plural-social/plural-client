import { StyleSheet } from 'react-native';

import { useMe, useSession } from '@/auth/session-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';

export default function ProfileScreen(): React.JSX.Element {
  const me = useMe();
  const { signOut } = useSession();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">@{me.username}</ThemedText>
      <Button label="Sign out" variant="secondary" onPress={() => void signOut()} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
});
