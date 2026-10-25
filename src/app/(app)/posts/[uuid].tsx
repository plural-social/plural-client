import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import type { Post } from '@/api/types';
import { useMe } from '@/auth/session-context';
import { CommentInput } from '@/components/comments/comment-input';
import { CommentRow } from '@/components/comments/comment-row';
import { PostItem } from '@/components/post/post-item';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { confirm } from '@/components/ui/confirm';
import { ErrorView } from '@/components/ui/error-view';
import { LoadingView } from '@/components/ui/loading-view';
import { Spacing } from '@/constants/theme';
import { isModerator } from '@/auth/roles';
import { useDeleteComment } from '@/hooks/use-post-mutations';
import { useReportSheet } from '@/hooks/use-report-sheet';
import { flattenPages, useComments, usePost } from '@/hooks/use-post-queries';

const POST_HEIGHT_FRACTION = 0.6;

export default function PostScreen(): React.JSX.Element {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const post = usePost(uuid);

  if (post.error) {
    if (post.error.status === 404) return <ErrorView message="This post isn't available." />;
    return <ErrorView message={post.error.message} onRetry={() => void post.refetch()} />;
  }
  if (post.isPending) return <LoadingView />;

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}>
      <ThemedView style={styles.fill}>
        <CommentList post={post.data} />
        <CommentInput postUuid={uuid} />
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

function CommentList({ post }: { post: Post }): React.JSX.Element {
  const me = useMe();
  const { height: windowHeight } = useWindowDimensions();
  const comments = useComments(post.uuid);
  const deleteComment = useDeleteComment(post.uuid);
  const report = useReportSheet();
  // One clock per render keeps every row's relative time consistent.
  const [now] = useState(() => new Date());

  async function handleDelete(commentUuid: string): Promise<void> {
    const confirmed = await confirm({
      title: 'Delete comment?',
      message: "This can't be undone.",
      confirmLabel: 'Delete',
    });
    if (confirmed) deleteComment.mutate(commentUuid);
  }

  return (
    <FlatList
      data={flattenPages(comments.data)}
      keyExtractor={(comment) => comment.uuid}
      ListHeaderComponent={
        <>
          <PostItem
            post={post}
            isActive
            height={windowHeight * POST_HEIGHT_FRACTION}
            bottomInset={0}
            onDeleted={() => router.back()}
          />
          <ThemedText type="smallBold" accessibilityRole="header" style={styles.heading}>
            Comments
          </ThemedText>
          {comments.isPending ? <ActivityIndicator /> : null}
          {comments.error ? (
            <ErrorView message={comments.error.message} onRetry={() => void comments.refetch()} />
          ) : null}
        </>
      }
      renderItem={({ item }) => (
        <CommentRow
          comment={item}
          now={now}
          canDelete={item.author.uuid === me.uuid || post.author.uuid === me.uuid || isModerator(me.role)}
          onDelete={() => void handleDelete(item.uuid)}
          onReport={
            item.author.uuid === me.uuid
              ? undefined
              : () => report.open({ type: 'comment', uuid: item.uuid, label: 'comment' })
          }
        />
      )}
      onEndReached={() => {
        if (comments.hasNextPage && !comments.isFetchingNextPage) void comments.fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        <>
          {comments.isFetchingNextPage ? <ActivityIndicator /> : <View style={styles.footer} />}
          {report.sheet}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  heading: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  footer: {
    height: Spacing.three,
  },
});
