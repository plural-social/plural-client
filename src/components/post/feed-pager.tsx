import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
  type FlatListProps,
} from 'react-native';

import type { ApiError } from '@/api/client';
import type { Page, Post } from '@/api/types';
import { PostItem } from '@/components/post/post-item';
import { ErrorView } from '@/components/ui/error-view';
import { LoadingView } from '@/components/ui/loading-view';
import { flattenPages } from '@/hooks/use-post-queries';
import { useWheelPaging } from '@/hooks/use-wheel-paging';

type FeedPagerProps = {
  query: UseInfiniteQueryResult<InfiniteData<Page<Post>>, ApiError>;
  /** Shown when the feed loaded and has no posts. */
  empty: React.ReactNode;
  /** False while another feed is shown on top. Hidden pagers keep their scroll position but have no active post. */
  visible: boolean;
};

// FlatList requires the viewability config to keep the same identity for its whole life.
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 60 };

/**
 * Vertical, one-post-per-screen pager. Each item is exactly as tall as the
 * pager, which makes snapping and getItemLayout exact.
 */
export function FeedPager({ query, empty, visible }: FeedPagerProps): React.JSX.Element {
  const [height, setHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<Post>>(null);
  // Mirrors activeIndex for the wheel handler, which runs outside render.
  const activeIndexRef = useRef(0);
  // Created once: FlatList throws if onViewableItemsChanged changes identity.
  const [onViewableItemsChanged] = useState(() => {
    const handler: FlatListProps<Post>['onViewableItemsChanged'] = ({ viewableItems }) => {
      const first = viewableItems[0];
      if (first?.index == null) return;
      activeIndexRef.current = first.index;
      setActiveIndex(first.index);
    };
    return handler;
  });

  const posts = flattenPages(query.data);

  const listMounted = height > 0 && posts.length > 0;
  useWheelPaging(listRef, listMounted, (direction) => {
    const index = Math.min(Math.max(activeIndexRef.current + direction, 0), posts.length - 1);
    listRef.current?.scrollToOffset({ offset: index * height, animated: true });
  });

  if (query.isPending) return <LoadingView />;
  if (query.error && posts.length === 0) {
    return <ErrorView message={query.error.message} onRetry={() => void query.refetch()} />;
  }
  if (posts.length === 0) return <>{empty}</>;

  return (
    <View style={styles.fill} onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
      {height === 0 ? null : (
        <FlatList
          ref={listRef}
          data={posts}
          keyExtractor={(post) => post.uuid}
          renderItem={({ item, index }) => <PostItem post={item} isActive={visible && index === activeIndex} height={height} />}
          pagingEnabled
          snapToInterval={height}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          removeClippedSubviews={Platform.OS === 'android'}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          onEndReachedThreshold={2}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
          viewabilityConfig={VIEWABILITY_CONFIG}
          onViewableItemsChanged={onViewableItemsChanged}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={styles.footer} /> : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
  },
});
