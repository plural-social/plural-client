import { Stack } from 'expo-router';

// Deep links into a pushed screen (e.g. /users/alice) still get the tabs underneath, so Back works.
export const unstable_settings = { anchor: '(tabs)' };

export default function AppLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="users/[username]" options={{ headerShown: true, title: '' }} />
      <Stack.Screen
        name="settings/edit-profile"
        options={{ presentation: 'modal', headerShown: true, title: 'Edit profile' }}
      />
    </Stack>
  );
}
