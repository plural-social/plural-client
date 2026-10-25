import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FeedKind } from '@/api/feed';
import { FeedPager } from '@/components/post/feed-pager';
import { MEDIA_BACKGROUND } from '@/components/post/post-media';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useFeed } from '@/hooks/use-post-queries';

const TABS: { kind: FeedKind; label: string }[] = [
  { kind: 'following', label: 'Following' },
  { kind: 'explore', label: 'Explore' },
];

export default function HomeScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<FeedKind>('following');
  const emptyStates: Record<FeedKind, React.ReactNode> = {
    following: (
      <EmptyFeed message="Follow people to see their posts here.">
        <Button label="Explore posts" onPress={() => setKind('explore')} />
      </EmptyFeed>
    ),
    explore: (
      <EmptyFeed message="No posts yet. Be the first!">
        <Button label="Create a post" onPress={() => router.navigate('/create')} />
      </EmptyFeed>
    ),
  };
  const queries = { following: useFeed('following'), explore: useFeed('explore') };

  return (
    <View style={styles.screen}>
      {/* Both pagers stay mounted and stacked, so switching keeps each one's scroll position. */}
      {TABS.map((tab) => {
        const visible = tab.kind === kind;
        return (
          <View
            key={tab.kind}
            style={[StyleSheet.absoluteFill, !visible && styles.hidden]}
            pointerEvents={visible ? 'auto' : 'none'}
            aria-hidden={!visible}
            importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
            accessibilityElementsHidden={!visible}>
            <FeedPager query={queries[tab.kind]} empty={emptyStates[tab.kind]} visible={visible} />
          </View>
        );
      })}

      <View style={[styles.tabs, { top: insets.top + Spacing.two }]} accessibilityRole="tablist">
        {TABS.map((tab) => {
          const selected = tab.kind === kind;
          return (
            <Pressable
              key={tab.kind}
              onPress={() => setKind(tab.kind)}
              accessibilityRole="tab"
              aria-selected={selected}
              style={styles.tab}>
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function EmptyFeed({ message, children }: { message: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
      {children}
    </View>
  );
}

const TEXT_ON_MEDIA = '#FFFFFF';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: MEDIA_BACKGROUND,
  },
  hidden: {
    opacity: 0,
  },
  tabs: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  tab: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  tabText: {
    color: TEXT_ON_MEDIA,
    fontSize: 17,
    opacity: 0.8,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 3,
  },
  tabTextSelected: {
    fontWeight: '700',
    opacity: 1,
    textDecorationLine: 'underline',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  emptyText: {
    color: TEXT_ON_MEDIA,
    fontSize: 17,
    textAlign: 'center',
  },
});
