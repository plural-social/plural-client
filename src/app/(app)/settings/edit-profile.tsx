import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/client';
import { updateMe } from '@/api/me';
import { queryKeys } from '@/api/query-keys';
import { useMe } from '@/auth/session-context';
import { Avatar } from '@/components/profile/avatar';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { FormScreen } from '@/components/ui/form-screen';
import { TextField } from '@/components/ui/text-field';
import { Limits } from '@/constants/limits';
import { Spacing } from '@/constants/theme';
import { useAvatarEditor } from '@/hooks/use-avatar-editor';

type Changes = { displayName?: string; bio?: string };

function fieldError(error: unknown, field: keyof Changes): string | undefined {
  const message = error instanceof ApiError ? error.details?.[field] : undefined;
  return typeof message === 'string' ? message : undefined;
}

export default function EditProfileScreen(): React.JSX.Element {
  const me = useMe();
  const queryClient = useQueryClient();
  const avatar = useAvatarEditor();
  const [displayName, setDisplayName] = useState(me.displayName);
  const [bio, setBio] = useState(me.bio);

  const changes: Changes = {};
  if (displayName !== me.displayName) changes.displayName = displayName;
  if (bio !== me.bio) changes.bio = bio;
  const hasChanges = Object.keys(changes).length > 0;

  const mutation = useMutation({
    mutationFn: updateMe,
    onSuccess: async (updated) => {
      queryClient.setQueryData(queryKeys.me, updated);
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile(updated.username) });
      router.back();
    },
  });

  const hasFieldErrors = fieldError(mutation.error, 'displayName') || fieldError(mutation.error, 'bio');

  return (
    <FormScreen>
      <View style={styles.avatar}>
        <View>
          <Avatar user={me} size={AVATAR_SIZE} />
          {avatar.busy ? (
            <View style={styles.busy} accessibilityLabel="Updating photo" accessibilityRole="progressbar">
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : null}
        </View>
        <View style={styles.avatarActions}>
          <TextAction label="Change photo" onPress={() => void avatar.change()} disabled={avatar.busy} />
          {me.avatarUrl ? <TextAction label="Remove photo" onPress={() => void avatar.remove()} disabled={avatar.busy} danger /> : null}
        </View>
        <FormError message={avatar.error ?? undefined} />
      </View>
      <TextField
        label="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={Limits.displayNameMaxLength}
        helperText={`${displayName.length} / ${Limits.displayNameMaxLength}`}
        error={fieldError(mutation.error, 'displayName')}
      />
      <TextField
        label="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={Limits.bioMaxLength}
        helperText={`${bio.length} / ${Limits.bioMaxLength}`}
        error={fieldError(mutation.error, 'bio')}
      />
      <FormError message={mutation.error && !hasFieldErrors ? mutation.error.message : undefined} />
      <Button
        label="Save"
        onPress={() => mutation.mutate(changes)}
        loading={mutation.isPending}
        disabled={!hasChanges}
      />
      <Button label="Delete account" variant="secondary" onPress={() => router.push('/settings/delete-account')} />
    </FormScreen>
  );
}

function TextAction({ label, onPress, disabled, danger }: { label: string; onPress: () => void; disabled: boolean; danger?: boolean }): React.JSX.Element {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }} style={styles.textAction}>
      {/* "linkPrimary" has a fixed blue; plain "link" takes the theme color. */}
      <ThemedText type={danger ? 'link' : 'linkPrimary'} themeColor={danger ? 'danger' : undefined}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const AVATAR_SIZE = 96;

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  // Dims the avatar while a new photo uploads.
  busy: {
    ...StyleSheet.absoluteFill,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  avatarActions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  textAction: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
