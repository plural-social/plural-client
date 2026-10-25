import { apiFetch } from '@/api/client';
import type { Instance } from '@/api/types';

export async function getInstance(): Promise<Instance> {
  return apiFetch<Instance>('/instance');
}
