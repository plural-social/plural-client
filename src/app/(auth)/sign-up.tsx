import { Link } from 'expo-router';
import { useState } from 'react';

import { ApiError } from '@/api/client';
import { useSession } from '@/auth/session-context';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { FormScreen } from '@/components/ui/form-screen';
import { TextField } from '@/components/ui/text-field';
import { Limits } from '@/constants/limits';

type Field = 'username' | 'email' | 'password';
type FieldErrors = Partial<Record<Field, string>>;

const FIELDS: readonly Field[] = ['username', 'email', 'password'];
// Mirrors the server check closely enough to catch typos; the server has the final say.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(input: Record<Field, string>): FieldErrors {
  const errors: FieldErrors = {};
  if (!Limits.usernamePattern.test(input.username)) {
    errors.username = 'Use 1-30 lowercase letters, numbers or _.';
  }
  if (!EMAIL_PATTERN.test(input.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (input.password.length < Limits.passwordMinLength || input.password.length > Limits.passwordMaxLength) {
    errors.password = `Use ${Limits.passwordMinLength}-${Limits.passwordMaxLength} characters.`;
  }
  return errors;
}

/** Splits a server error into per-field errors and a form-level message. */
function serverErrors(error: unknown): { fields: FieldErrors; form?: string } {
  if (!(error instanceof ApiError)) return { fields: {}, form: 'Something went wrong.' };
  switch (error.type) {
    case 'usernameConflict':
      return { fields: { username: 'That username is taken.' } };
    case 'emailConflict':
      return { fields: { email: 'That email already has an account.' } };
    case 'validation': {
      const fields: FieldErrors = {};
      for (const field of FIELDS) {
        const message = error.details?.[field];
        if (typeof message === 'string') fields[field] = message;
      }
      return { fields };
    }
    case 'rateLimited':
      return { fields: {}, form: 'Too many sign-ups from this network. Try again later.' };
    default:
      return { fields: {}, form: error.message };
  }
}

export default function SignUpScreen(): React.JSX.Element {
  const { signUp } = useSession();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  async function handleSubmit(): Promise<void> {
    const input = {
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password,
    };
    const clientErrors = validate(input);
    setFieldErrors(clientErrors);
    setFormError(undefined);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      await signUp(input);
    } catch (error) {
      const { fields, form } = serverErrors(error);
      setFieldErrors(fields);
      setFormError(form);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormScreen>
      <ThemedText type="subtitle" accessibilityRole="header">
        Create an account
      </ThemedText>
      <TextField
        label="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username-new"
        helperText="Lowercase letters, numbers and _ only. You can't change it later."
        error={fieldErrors.username}
      />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        error={fieldErrors.email}
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        helperText="At least 8 characters."
        error={fieldErrors.password}
      />
      <FormError message={formError} />
      <Button label="Create account" onPress={() => void handleSubmit()} loading={submitting} />
      <Link href="/sign-in" accessibilityRole="link">
        <ThemedText type="linkPrimary">I already have an account</ThemedText>
      </Link>
    </FormScreen>
  );
}
