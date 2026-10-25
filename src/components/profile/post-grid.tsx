import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import type { ApiError } from '@/api/client';
import type { Page, Post } from '@/api/types';
import { MEDIA_BACKGROUND } from '@/components/post/post-media';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { flattenPages } from '@/hooks/use-post-queries';

type PostGridProps = {
  query: UseInfiniteQueryResult<InfiniteData<Page<Post>>, ApiError>;
  header: React.ReactElement;
  /** Extra refresh work on pull-to-refresh, e.g. reloading the profile header. */
  onRefresh?: () => void;
};

const COLUMNS = 3;
const GAP = 2;

/** Three-column grid of a user's posts under a header. */
export function PostGrid({ query, header, onRefresh }: PostGridProps): React.JSX.Element {
  const [width, setWidth] = useState(0);
  const cellSize = (width - GAP * (COLUMNS - 1)) / COLUMNS;

  return (
    <View style={styles.fill} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <FlatList
        data={flattenPages(query.data)}
        keyExtractor={(post) => post.uuid}
        numColumns={COLUMNS}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        renderItem={({ item }) => (width === 0 ? null : <GridCell post={item} size={cellSize} />)}
        ListEmptyComponent={
          query.isPending ? (
            <ActivityIndicator />
          ) : (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              No posts yet.
            </ThemedText>
          )
        }
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator /> : undefined}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={1}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => {
              void query.refetch();
              onRefresh?.();
            }}
          />
        }
      />
    </View>
  );
}

function GridCell({ post, size }: { post: Post; size: number }): React.JSX.Element {
  const { media } = post;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={post.caption || `Post by @${post.author.username}`}
      onPress={() => router.push(`/posts/${post.uuid}`)}
      style={{ width: size, height: size }}>
      {media.status === 'ready' ? (
        <Image source={{ uri: media.thumbnailUrl }} contentFit="cover" style={styles.fill} />
      ) : (
        <View style={styles.pending}>
          <Text style={styles.pendingText}>{media.status === 'processing' ? 'Processing' : 'Failed'}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    gap: GAP,
  },
  row: {
    gap: GAP,
  },
  empty: {
    textAlign: 'center',
    padding: Spacing.four,
  },
  pending: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MEDIA_BACKGROUND,
  },
  pendingText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
});
