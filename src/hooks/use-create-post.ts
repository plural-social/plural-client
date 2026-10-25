import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform } from 'react-native';

import { ApiError } from '@/api/client';
import { createPost } from '@/api/posts';
import { queryKeys } from '@/api/query-keys';
import { useMe } from '@/auth/session-context';
import { Limits } from '@/constants/limits';
import { prepareImage, type PreparedFile } from '@/media/prepare-image';
import { uploadMedia } from '@/media/upload-media';
import { videoMimeType } from '@/media/video-mime';

export type Draft =
  | { kind: 'image'; file: PreparedFile }
  | { kind: 'video'; uri: string; mimeType: string; width: number; height: number; durationMs: number | null };

export type CreatePostState =
  | { step: 'empty' }
  | { step: 'preparing' }
  | { step: 'ready'; draft: Draft }
  | { step: 'uploading'; draft: Draft; progress: number | null }
  | { step: 'posting'; draft: Draft };

const PICK_ERROR = "Couldn't open that photo. Try another one.";
const PERMISSION_ERROR = 'Plural needs access to your photo library to post videos.';

/**
 * The picked video's length in milliseconds, or null when it is unknown.
 *
 * The web picker reads the length by loading the file into an HTML <video>,
 * which reports seconds. When the browser cannot decode the file (often HEVC
 * .mov files from iPhones), it reports 0 or NaN instead. Native pickers report
 * milliseconds and always know the length.
 */
function pickedDurationMs(asset: ImagePicker.ImagePickerAsset): number | null {
  const duration = asset.duration;
  if (duration == null || !Number.isFinite(duration) || duration <= 0) return null;
  return Platform.OS === 'web' ? duration * 1000 : duration;
}

/**
 * Checks a picked video against the server's limits, so a doomed upload never
 * starts. An unknown length passes: the server measures it and marks the post
 * failed with a reason if it is out of range.
 */
function videoDraft(asset: ImagePicker.ImagePickerAsset): { draft: Draft } | { error: string } {
  const durationMs = pickedDurationMs(asset);
  if (durationMs != null && durationMs < 1000) return { error: 'Videos must be at least 1 second long.' };
  if (durationMs != null && durationMs > Limits.videoMaxDurationSeconds * 1000) {
    return { error: 'Videos must be 3 minutes or shorter.' };
  }
  if (asset.fileSize != null && asset.fileSize > Limits.videoMaxBytes) {
    return { error: 'Videos must be 300 MB or smaller.' };
  }
  const mimeType = videoMimeType(asset);
  if (!mimeType) return { error: "This video format isn't supported." };
  return {
    draft: { kind: 'video', uri: asset.uri, mimeType, width: asset.width, height: asset.height, durationMs },
  };
}

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
  /** True when the error is a denied permission that only the Settings app can fix. */
  needsSettings: boolean;
  openSettings: () => void;
  pick: () => Promise<void>;
  clear: () => void;
  submit: () => Promise<void>;
} {
  const me = useMe();
  const queryClient = useQueryClient();
  const [state, setState] = useState<CreatePostState>({ step: 'empty' });
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [needsSettings, setNeedsSettings] = useState(false);

  async function pick(): Promise<void> {
    setNeedsSettings(false);
    // iOS asks for library access after a video is picked unless it was granted
    // before (see the expo-image-picker docs), so ask first.
    if (Platform.OS === 'ios') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(PERMISSION_ERROR);
        setNeedsSettings(true);
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 1,
      shouldDownloadFromNetwork: true,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;

    setError(null);
    if (asset.type === 'video') {
      const picked = videoDraft(asset);
      if ('error' in picked) {
        setError(picked.error);
        return;
      }
      setState({ step: 'ready', draft: picked.draft });
      return;
    }

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
      // Images were re-encoded when picked; videos upload as they are and the server transcodes them.
      const file = draft.kind === 'image' ? draft.file : draft;
      const media = await uploadMedia({
        uri: file.uri,
        mimeType: file.mimeType,
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

  return {
    state,
    caption,
    setCaption,
    error,
    needsSettings,
    openSettings: () => void Linking.openSettings(),
    pick,
    clear,
    submit,
  };
}
