import { useInfiniteQuery } from '@tanstack/react-query';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { listBlocks } from '@/api/moderation';
import { queryKeys } from '@/api/query-keys';
import { Avatar } from '@/components/profile/avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ErrorView } from '@/components/ui/error-view';
import { LoadingView } from '@/components/ui/loading-view';
import { Spacing } from '@/constants/theme';
import { useBlockUser } from '@/hooks/use-moderation';
import { flattenPages } from '@/hooks/use-post-queries';

const AVATAR_SIZE = 40;

export default function BlockedAccountsScreen(): React.JSX.Element {
  const { unblock } = useBlockUser();
  const blocks = useInfiniteQuery({
    queryKey: queryKeys.blocks,
    queryFn: ({ pageParam }) => listBlocks(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  if (blocks.isPending) return <LoadingView />;
  if (blocks.error) return <ErrorView message={blocks.error.message} onRetry={() => void blocks.refetch()} />;

  return (
    <ThemedView style={styles.fill}>
      <FlatList
        data={flattenPages(blocks.data)}
        keyExtractor={(user) => user.uuid}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Avatar user={item} size={AVATAR_SIZE} />
            <View style={styles.names}>
              {item.displayName ? <ThemedText type="smallBold">{item.displayName}</ThemedText> : null}
              <ThemedText type="small" themeColor="textSecondary">
                @{item.username}
              </ThemedText>
            </View>
            <Button label="Unblock" variant="secondary" onPress={() => void unblock(item)} />
          </View>
        )}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            You haven&apos;t blocked anyone.
          </ThemedText>
        }
        onEndReached={() => {
          if (blocks.hasNextPage && !blocks.isFetchingNextPage) void blocks.fetchNextPage();
        }}
        ListFooterComponent={blocks.isFetchingNextPage ? <ActivityIndicator /> : undefined}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  names: {
    flex: 1,
  },
  empty: {
    textAlign: 'center',
    padding: Spacing.four,
  },
});
