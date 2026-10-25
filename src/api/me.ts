import { apiFetch } from '@/api/client';
import type { Me } from '@/api/types';

export async function getMe(): Promise<Me> {
  return apiFetch<Me>('/me');
}
