import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/client';
import { getInstance } from '@/api/instance';
import { queryKeys } from '@/api/query-keys';
import { useSession } from '@/auth/session-context';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { FormScreen } from '@/components/ui/form-screen';
import { TextField } from '@/components/ui/text-field';
import { Limits } from '@/constants/limits';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
  const { data: instance } = useQuery({ queryKey: queryKeys.instance, queryFn: getInstance });
  const termsUrl = instance?.termsUrl;
  const [agreed, setAgreed] = useState(false);
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
      {termsUrl ? <TermsRow url={termsUrl} checked={agreed} onToggle={() => setAgreed((a) => !a)} /> : null}
      <FormError message={formError} />
      <Button
        label="Create account"
        onPress={() => void handleSubmit()}
        loading={submitting}
        disabled={Boolean(termsUrl) && !agreed}
      />
      <Link href="/sign-in" accessibilityRole="link">
        <ThemedText type="linkPrimary">I already have an account</ThemedText>
      </Link>
    </FormScreen>
  );
}

const CHECKBOX_SIZE = 22;

/** Required agreement to the instance's terms, shown only when the instance has a terms page. */
function TermsRow({ url, checked, onToggle }: { url: string; checked: boolean; onToggle: () => void }): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.terms}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        aria-checked={checked}
        accessibilityLabel="I agree to the Terms and Community Guidelines"
        hitSlop={Spacing.two}
        style={[
          styles.checkbox,
          { borderColor: checked ? theme.primary : theme.textSecondary, backgroundColor: checked ? theme.primary : undefined },
        ]}>
        {checked ? <ThemedText style={styles.checkmark}>✓</ThemedText> : null}
      </Pressable>
      <ThemedText style={styles.termsText}>
        I agree to the{' '}
        <ThemedText type="linkPrimary" accessibilityRole="link" onPress={() => void WebBrowser.openBrowserAsync(url)}>
          Terms and Community Guidelines
        </ThemedText>
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  terms: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
  },
  checkbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderRadius: Spacing.one,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 16,
  },
  termsText: {
    flex: 1,
  },
});
