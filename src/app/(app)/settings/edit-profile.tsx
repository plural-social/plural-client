import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';

import { ApiError } from '@/api/client';
import { updateMe } from '@/api/me';
import { queryKeys } from '@/api/query-keys';
import { useMe } from '@/auth/session-context';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { FormScreen } from '@/components/ui/form-screen';
import { TextField } from '@/components/ui/text-field';
import { Limits } from '@/constants/limits';

type Changes = { displayName?: string; bio?: string };

function fieldError(error: unknown, field: keyof Changes): string | undefined {
  const message = error instanceof ApiError ? error.details?.[field] : undefined;
  return typeof message === 'string' ? message : undefined;
}

export default function EditProfileScreen(): React.JSX.Element {
  const me = useMe();
  const queryClient = useQueryClient();
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
    </FormScreen>
  );
}
