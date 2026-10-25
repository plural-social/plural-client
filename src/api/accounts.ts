import { apiFetch } from '@/api/client';
import type { Account } from '@/api/types';

export async function createAccount(input: {
  username: string;
  email: string;
  password: string;
}): Promise<Account> {
  return apiFetch<Account>('/accounts', { method: 'POST', json: input });
}
