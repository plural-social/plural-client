import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Post } from '@/api/types';
import { PostActions } from '@/components/post/post-actions';
import { MEDIA_BACKGROUND, PostMedia } from '@/components/post/post-media';
import { Avatar } from '@/components/profile/avatar';
import { Spacing } from '@/constants/theme';

type PostItemProps = {
  post: Post;
  isActive: boolean;
  /** True for the active post and its neighbors; see PostMedia. */
  isNear: boolean;
  height: number;
  /** Bottom inset to keep the caption clear of the tab bar or home indicator. Defaults to the safe area. */
  bottomInset?: number;
  onDeleted?: () => void;
};

const AVATAR_SIZE = 36;
const CAPTION_LINES = 3;
const TEXT_ON_MEDIA = '#FFFFFF';

/** One full-height post: media with the author, caption and actions overlaid. */
export function PostItem({ post, isActive, isNear, height, bottomInset, onDeleted }: PostItemProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const { author } = post;
  const bottom = (bottomInset ?? insets.bottom) + Spacing.three;

  return (
    <View style={[styles.container, { height }]}>
      <PostMedia post={post} isActive={isActive} isNear={isNear} />

      <View style={[styles.info, { paddingBottom: bottom }]}>
        <Pressable
          style={styles.author}
          accessibilityRole="link"
          accessibilityLabel={`Open @${author.username}'s profile`}
          onPress={() => router.push(`/users/${author.username}`)}>
          <Avatar user={author} size={AVATAR_SIZE} />
          <Text style={styles.username}>@{author.username}</Text>
        </Pressable>
        {post.caption ? (
          <Text
            style={styles.caption}
            numberOfLines={captionExpanded ? undefined : CAPTION_LINES}
            onPress={() => setCaptionExpanded((expanded) => !expanded)}>
            {post.caption}
          </Text>
        ) : null}
      </View>

      <View style={[styles.actions, { bottom: bottom + Spacing.five }]}>
        <PostActions post={post} onDeleted={onDeleted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: MEDIA_BACKGROUND,
    overflow: 'hidden',
  },
  info: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // Right padding leaves room for the action column.
    paddingLeft: Spacing.three,
    paddingRight: Spacing.six + Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.two,
    // A flat scrim instead of a gradient: keeps text readable without another package.
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    alignSelf: 'flex-start',
    minHeight: 44,
  },
  username: {
    color: TEXT_ON_MEDIA,
    fontWeight: '700',
    fontSize: 16,
  },
  caption: {
    color: TEXT_ON_MEDIA,
    fontSize: 15,
    lineHeight: 21,
  },
  actions: {
    position: 'absolute',
    right: Spacing.two,
  },
});
