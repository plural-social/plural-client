import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { ApiError } from '@/api/client';
import { deleteMe } from '@/api/me';
import { useSession } from '@/auth/session-context';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { confirm } from '@/components/ui/confirm';
import { FormError } from '@/components/ui/form-error';
import { FormScreen } from '@/components/ui/form-screen';
import { TextField } from '@/components/ui/text-field';

function deleteErrorMessage(error: Error): string {
  if (error instanceof ApiError && error.type === 'invalidCredentials') return 'Wrong password.';
  if (error instanceof ApiError && error.type === 'rateLimited') return 'Too many attempts. Wait a minute and try again.';
  return error.message;
}

export default function DeleteAccountScreen(): React.JSX.Element {
  const { endSession } = useSession();
  const [password, setPassword] = useState('');
  const deletion = useMutation({
    mutationFn: deleteMe,
    // The server already ended every session, so this only clears the device.
    onSuccess: () => endSession(),
  });

  async function handleDelete(): Promise<void> {
    const confirmed = await confirm({
      title: 'Delete your account?',
      message: "This can't be undone.",
      confirmLabel: 'Delete',
    });
    if (confirmed) deletion.mutate(password);
  }

  return (
    <FormScreen>
      <ThemedText>This deletes your account, posts, comments and likes. It can&apos;t be undone.</ThemedText>
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
      />
      <FormError message={deletion.error ? deleteErrorMessage(deletion.error) : undefined} />
      <Button
        label="Delete my account"
        variant="danger"
        onPress={() => void handleDelete()}
        loading={deletion.isPending}
        disabled={!password}
      />
    </FormScreen>
  );
}
