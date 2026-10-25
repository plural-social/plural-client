import { apiFetch } from '@/api/client';
import type { Media } from '@/api/types';

import type { UploadInput } from './upload-media';

/** Web upload through fetch. fetch cannot report upload progress, so onProgress is never called. */
export async function uploadMedia(input: UploadInput): Promise<Media> {
  const blob = await (await fetch(input.uri)).blob();
  return apiFetch<Media>('/media', {
    method: 'POST',
    rawBody: blob,
    contentType: input.mimeType,
    signal: input.signal,
  });
}
