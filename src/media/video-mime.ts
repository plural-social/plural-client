import type { ImagePickerAsset } from 'expo-image-picker';

const ACCEPTED = ['video/mp4', 'video/quicktime', 'video/webm'];

// Pickers often report no MIME type (or a generic one), so the extension is the fallback.
const BY_EXTENSION: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
};

/** Returns a MIME type the API accepts for a picked video, or null. */
export function videoMimeType(asset: ImagePickerAsset): string | null {
  if (asset.mimeType && ACCEPTED.includes(asset.mimeType)) return asset.mimeType;
  const extension = asset.uri.split(/[?#]/)[0]?.split('.').pop()?.toLowerCase();
  return (extension && BY_EXTENSION[extension]) || null;
}
