import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Limits } from '@/constants/limits';
import { Spacing } from '@/constants/theme';
import { useCreateComment } from '@/hooks/use-post-mutations';
import { useTheme } from '@/hooks/use-theme';

const INPUT_MAX_HEIGHT = 120;

/** Text box and Send button pinned under the comments list. */
export function CommentInput({ postUuid }: { postUuid: string }): React.JSX.Element {
  const theme = useTheme();
  const [body, setBody] = useState('');
  const createComment = useCreateComment(postUuid);
  const trimmed = body.trim();

  function send(): void {
    createComment.mutate(trimmed, { onSuccess: () => setBody('') });
  }

  return (
    <ThemedView style={[styles.bar, { borderTopColor: theme.backgroundSelected }]}>
      {createComment.error ? (
        <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
          {createComment.error.message}
        </ThemedText>
      ) : null}
      <View style={styles.row}>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Add a comment…"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Comment"
          multiline
          maxLength={Limits.commentMaxLength}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
        <Button label="Send" onPress={send} loading={createComment.isPending} disabled={!trimmed} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: INPUT_MAX_HEIGHT,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
});
