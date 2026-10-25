import { apiFetch } from '@/api/client';
import type { Media } from '@/api/types';

export async function getMedia(uuid: string): Promise<Media> {
  return apiFetch<Media>(`/media/${encodeURIComponent(uuid)}`);
}
