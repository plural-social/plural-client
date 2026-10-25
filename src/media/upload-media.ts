import { File, UploadType } from 'expo-file-system';

import { getApiUrl } from '@/api/config';
import { getAuthToken, networkError, notifyIfSessionEnded, toApiError } from '@/api/client';
import type { Media } from '@/api/types';

export type UploadInput = {
  uri: string;
  mimeType: string;
  /** Called with a value from 0 to 1. Not called on web. */
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
};

/** Uploads a file to POST /media and returns the created media. */
export async function uploadMedia(input: UploadInput): Promise<Media> {
  const token = getAuthToken();
  let result;
  try {
    result = await new File(input.uri).upload(`${getApiUrl()}/media`, {
      httpMethod: 'POST',
      uploadType: UploadType.BINARY_CONTENT,
      mimeType: input.mimeType,
      headers: {
        'Content-Type': input.mimeType,
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      onProgress: ({ bytesSent, totalBytes }) =>
        input.onProgress?.(totalBytes > 0 ? bytesSent / totalBytes : 0),
      signal: input.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw networkError();
  }

  if (result.status < 200 || result.status >= 300) {
    const error = toApiError(result.status, result.body);
    notifyIfSessionEnded(error);
    throw error;
  }
  return JSON.parse(result.body) as Media;
}
