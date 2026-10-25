import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';

import { ApiError } from '@/api/client';
import { createPost } from '@/api/posts';
import { queryKeys } from '@/api/query-keys';
import { useMe } from '@/auth/session-context';
import { prepareImage, type PreparedFile } from '@/media/prepare-image';
import { uploadMedia } from '@/media/upload-media';

type Draft = { file: PreparedFile; kind: 'image' };

export type CreatePostState =
  | { step: 'empty' }
  | { step: 'preparing' }
  | { step: 'ready'; draft: Draft }
  | { step: 'uploading'; draft: Draft; progress: number | null }
  | { step: 'posting'; draft: Draft };

const PICK_ERROR = "Couldn't open that photo. Try another one.";

function submitErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Something went wrong. Try again.';
  switch (error.type) {
    case 'mediaTooLarge':
      return 'This file is too large.';
    case 'unsupportedMediaType':
    case 'invalidMedia':
      return "This file type isn't supported.";
    case 'rateLimited':
      return "You're posting too fast. Try again in a minute.";
    default:
      return error.message;
  }
}

/**
 * State machine behind the Create tab:
 * empty → preparing → ready → uploading → posting → (success: back to empty)
 * Any failure returns to `empty` (picking) or `ready` (submitting, draft kept).
 */
export function useCreatePost(): {
  state: CreatePostState;
  caption: string;
  setCaption: (caption: string) => void;
  error: string | null;
  pick: () => Promise<void>;
  clear: () => void;
  submit: () => Promise<void>;
} {
  const me = useMe();
  const queryClient = useQueryClient();
  const [state, setState] = useState<CreatePostState>({ step: 'empty' });
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function pick(): Promise<void> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;

    setError(null);
    setState({ step: 'preparing' });
    try {
      setState({ step: 'ready', draft: { file: await prepareImage(asset), kind: 'image' } });
    } catch {
      setState({ step: 'empty' });
      setError(PICK_ERROR);
    }
  }

  function clear(): void {
    setError(null);
    setState({ step: 'empty' });
  }

  async function submit(): Promise<void> {
    if (state.step !== 'ready') return;
    const { draft } = state;

    setError(null);
    // fetch cannot report upload progress on web, so the bar is indeterminate there.
    setState({ step: 'uploading', draft, progress: Platform.OS === 'web' ? null : 0 });
    try {
      const media = await uploadMedia({
        uri: draft.file.uri,
        mimeType: draft.file.mimeType,
        onProgress: (progress) => setState({ step: 'uploading', draft, progress }),
      });
      setState({ step: 'posting', draft });
      await createPost({ mediaUuid: media.uuid, caption: caption.trim() });
    } catch (submitError) {
      setState({ step: 'ready', draft });
      setError(submitErrorMessage(submitError));
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.userPosts(me.username) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(me.username) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.feed('following') }),
      queryClient.invalidateQueries({ queryKey: queryKeys.feed('explore') }),
    ]);
    setState({ step: 'empty' });
    setCaption('');
    router.navigate('/profile');
  }

  return { state, caption, setCaption, error, pick, clear, submit };
}
