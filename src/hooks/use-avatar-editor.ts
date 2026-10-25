import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { invalidatePostQueries } from '@/api/post-cache';
import { removeAvatar, setAvatar } from '@/api/me';
import { queryKeys } from '@/api/query-keys';
import type { Me } from '@/api/types';
import { prepareImage } from '@/media/prepare-image';
import { uploadMedia } from '@/media/upload-media';

/**
 * Changing or removing the avatar saves immediately; it does not wait for the
 * profile form's Save button. `busy` covers the whole upload.
 */
export function useAvatarEditor(): {
  busy: boolean;
  error: string | null;
  change: () => Promise<void>;
  remove: () => Promise<void>;
} {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Runs an avatar change, then refreshes every place that shows the avatar. */
  async function run(action: () => Promise<Me>): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const me = await action();
      queryClient.setQueryData(queryKeys.me, me);
      // Posts and comments embed the author's avatar, so their caches are stale too.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profile(me.username) }),
        queryClient.invalidateQueries({ queryKey: ['comments'] }),
        invalidatePostQueries(queryClient),
      ]);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function change(): Promise<void> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;

    await run(async () => {
      const file = await prepareImage(asset);
      const media = await uploadMedia({ uri: file.uri, mimeType: file.mimeType });
      return setAvatar(media.uuid);
    });
  }

  return { busy, error, change, remove: () => run(removeAvatar) };
}
