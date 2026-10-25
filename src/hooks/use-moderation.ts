import { useQueryClient } from '@tanstack/react-query';

import { blockUser, unblockUser } from '@/api/moderation';
import { invalidatePostQueries } from '@/api/post-cache';
import { queryKeys } from '@/api/query-keys';
import type { UserSummary } from '@/api/types';
import { confirm } from '@/components/ui/confirm';

/**
 * Block and unblock. Blocking hides posts and comments both ways, so every
 * cached list that might contain the other user is refetched.
 */
export function useBlockUser(): {
  block: (user: UserSummary) => Promise<void>;
  unblock: (user: UserSummary) => Promise<void>;
} {
  const queryClient = useQueryClient();

  async function refresh(username: string): Promise<void> {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(username) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks }),
      queryClient.invalidateQueries({ queryKey: ['comments'] }),
      invalidatePostQueries(queryClient),
    ]);
  }

  return {
    block: async (user) => {
      const confirmed = await confirm({
        title: `Block @${user.username}?`,
        message: "They won't see your posts, and you won't see theirs. They won't be told.",
        confirmLabel: 'Block',
      });
      if (!confirmed) return;
      await blockUser(user.username);
      await refresh(user.username);
    },
    unblock: async (user) => {
      await unblockUser(user.username);
      await refresh(user.username);
    },
  };
}
