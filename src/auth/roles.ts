import type { Role } from '@/api/types';

/** Moderators and admins can review reports and remove content. */
export function isModerator(role: Role): boolean {
  return role === 'moderator' || role === 'admin';
}
