import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Comment } from '@/api/types';
import { Avatar } from '@/components/profile/avatar';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatRelativeTime } from '@/utils/time';

type CommentRowProps = {
  comment: Comment;
  canDelete: boolean;
  onDelete: () => void;
  /** Set when the viewer may report this comment (it is not their own). */
  onReport?: () => void;
  now: Date;
};

const AVATAR_SIZE = 32;

export function CommentRow({ comment, canDelete, onDelete, onReport, now }: CommentRowProps): React.JSX.Element {
  const { author } = comment;

  return (
    <View style={styles.row}>
      <Avatar user={author} size={AVATAR_SIZE} />
      <View style={styles.content}>
        <View style={styles.meta}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open @${author.username}'s profile`}
            onPress={() => router.push(`/users/${author.username}`)}>
            <ThemedText type="smallBold">@{author.username}</ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary">
            {formatRelativeTime(comment.createdAt, now)}
          </ThemedText>
          <View style={styles.actions}>
            {onReport ? (
              <Pressable onPress={onReport} accessibilityRole="button" accessibilityLabel="Report comment" hitSlop={Spacing.two}>
                <ThemedText type="small" themeColor="textSecondary">
                  Report
                </ThemedText>
              </Pressable>
            ) : null}
            {canDelete ? (
              <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel="Delete comment" hitSlop={Spacing.two}>
                <ThemedText type="small" themeColor="danger">
                  Delete
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>
        <ThemedText>{comment.body}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  content: {
    flex: 1,
    gap: Spacing.half,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginLeft: 'auto',
  },
});
