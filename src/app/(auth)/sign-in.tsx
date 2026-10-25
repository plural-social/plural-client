import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useState } from 'react';

import { ApiError } from '@/api/client';
import { getInstance } from '@/api/instance';
import { queryKeys } from '@/api/query-keys';
import { useSession } from '@/auth/session-context';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { FormScreen } from '@/components/ui/form-screen';
import { TextField } from '@/components/ui/text-field';

function signInErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.type === 'invalidCredentials') return 'Wrong username, email or password.';
    if (error.type === 'rateLimited') return 'Too many attempts. Wait a minute and try again.';
    if (error.type === 'accountSuspended') return 'This account is suspended.';
    return error.message;
  }
  return 'Something went wrong.';
}

export default function SignInScreen(): React.JSX.Element {
  const { signIn } = useSession();
  const { data: instance } = useQuery({ queryKey: queryKeys.instance, queryFn: getInstance });
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();

  async function handleSubmit(): Promise<void> {
    setSubmitting(true);
    setFormError(undefined);
    try {
      await signIn(login, password);
    } catch (error) {
      setFormError(signInErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormScreen>
      <ThemedText type="subtitle" accessibilityRole="header">
        {instance ? `Sign in to ${instance.name}` : 'Sign in'}
      </ThemedText>
      <TextField
        label="Username or email"
        value={login}
        onChangeText={setLogin}
        autoCapitalize="none"
        autoComplete="username"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
      />
      <FormError message={formError} />
      <Button
        label="Sign in"
        onPress={() => void handleSubmit()}
        loading={submitting}
        disabled={!login || !password}
      />
      <Link href="/sign-up" accessibilityRole="link">
        <ThemedText type="linkPrimary">Create an account</ThemedText>
      </Link>
    </FormScreen>
  );
}
