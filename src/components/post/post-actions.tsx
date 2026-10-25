import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Post } from '@/api/types';
import { useMe } from '@/auth/session-context';
import { confirm } from '@/components/ui/confirm';
import { Spacing } from '@/constants/theme';
import { useActionMenu } from '@/hooks/use-action-menu';
import { useDeletePost, useToggleLike } from '@/hooks/use-post-mutations';
import { useReportSheet } from '@/hooks/use-report-sheet';

type PostActionsProps = {
  post: Post;
  /** Called after the post is deleted, e.g. to leave the detail screen. */
  onDeleted?: () => void;
};

const ICON_SIZE = 32;
const LIKED_COLOR = '#FF3B5C';
const ON_MEDIA_COLOR = '#FFFFFF';

/** Like, comments and menu buttons stacked on the right side of a post. */
export function PostActions({ post, onDeleted }: PostActionsProps): React.JSX.Element {
  const me = useMe();
  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();
  const { open, menu } = useActionMenu();
  const report = useReportSheet();

  async function handleDelete(): Promise<void> {
    const confirmed = await confirm({
      title: 'Delete post?',
      message: "This can't be undone.",
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    // On failure the post simply stays; the mutation error is not worth a dialog.
    deletePost.mutate(post.uuid, { onSuccess: () => onDeleted?.() });
  }

  function openMenu(): void {
    open(
      post.author.uuid === me.uuid
        ? [{ label: 'Delete post', destructive: true, onPress: () => void handleDelete() }]
        : [{ label: 'Report post', onPress: () => report.open({ type: 'post', uuid: post.uuid, label: 'post' }) }],
    );
  }

  return (
    <View style={styles.column}>
      <ActionButton
        icon={post.likedByMe ? 'heart' : 'heart-outline'}
        color={post.likedByMe ? LIKED_COLOR : ON_MEDIA_COLOR}
        count={post.likeCount}
        label={post.likedByMe ? 'Unlike post' : 'Like post'}
        selected={post.likedByMe}
        onPress={() => toggleLike(post)}
      />
      <ActionButton
        icon="chatbubble-outline"
        count={post.commentCount}
        label={`Comments, ${post.commentCount}`}
        onPress={() => router.push(`/posts/${post.uuid}`)}
      />
      <ActionButton icon="ellipsis-horizontal" label="More options" onPress={openMenu} />
      {menu}
      {report.sheet}
    </View>
  );
}

type ActionButtonProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color?: string;
  count?: number;
  label: string;
  selected?: boolean;
  onPress: () => void;
};

function ActionButton({ icon, color = ON_MEDIA_COLOR, count, label, selected, onPress }: ActionButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-selected={selected}
      hitSlop={Spacing.one}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Ionicons name={icon} size={ICON_SIZE} color={color} style={styles.shadow} />
      {count === undefined ? null : <Text style={[styles.count, styles.shadow]}>{count}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  column: {
    gap: Spacing.three,
    alignItems: 'center',
  },
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  // Keeps white icons readable on light images.
  shadow: {
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  count: {
    color: ON_MEDIA_COLOR,
    fontSize: 13,
    fontWeight: '600',
    marginTop: Spacing.half,
  },
});
