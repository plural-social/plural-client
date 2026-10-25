import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/client';
import { resolveReport, type ModerationAction } from '@/api/moderation';
import { invalidatePostQueries } from '@/api/post-cache';
import type { Report } from '@/api/types';
import { reasonLabel } from '@/components/moderation/report-reasons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { confirm } from '@/components/ui/confirm';
import { FormError } from '@/components/ui/form-error';
import { TextField } from '@/components/ui/text-field';
import { Limits } from '@/constants/limits';
import { Spacing } from '@/constants/theme';
import { formatRelativeTime } from '@/utils/time';

const THUMBNAIL_SIZE = 64;
const PREVIEW_LINES = 4;

const CONFIRMATIONS: Record<ModerationAction, { title: string; message: string; confirmLabel: string }> = {
  dismiss: { title: 'Dismiss report?', message: 'The content stays up.', confirmLabel: 'Dismiss' },
  removeContent: {
    title: 'Remove content?',
    message: 'It is hidden from everyone and every open report on it is resolved.',
    confirmLabel: 'Remove',
  },
  suspendAccount: {
    title: 'Suspend account?',
    message: 'The account is signed out, cannot sign in, and its content is hidden.',
    confirmLabel: 'Suspend',
  },
};

function resolveErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Something went wrong. Try again.';
  if (error.type === 'forbidden') return "You can't suspend this account.";
  if (error.type === 'reportAlreadyResolved') return 'Someone already handled this report.';
  return error.message;
}

/** One report for moderators: what was reported, by whom, and the actions while it is open. */
export function ReportCard({ report, now }: { report: Report; now: Date }): React.JSX.Element {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const preview = report.targetPreview;

  async function refresh(): Promise<void> {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['adminReports'] }),
      invalidatePostQueries(queryClient),
    ]);
  }

  async function act(action: ModerationAction): Promise<void> {
    if (!(await confirm(CONFIRMATIONS[action]))) return;
    setBusy(true);
    setError(undefined);
    try {
      await resolveReport(report.uuid, { action, note: note.trim() });
      await refresh();
    } catch (actionError) {
      setError(resolveErrorMessage(actionError));
      if (actionError instanceof ApiError && actionError.type === 'reportAlreadyResolved') await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">
        {reasonLabel(report.reason)} · {report.targetType} · {formatRelativeTime(report.createdAt, now)}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Reported by @{report.reporter.username}
      </ThemedText>

      {preview ? (
        <ThemedView style={styles.preview}>
          {preview.thumbnailUrl ? (
            <Image
              source={{ uri: preview.thumbnailUrl }}
              contentFit="cover"
              style={styles.thumbnail}
              accessibilityLabel="Reported post"
            />
          ) : null}
          <View style={styles.previewText}>
            {preview.username ? <ThemedText type="smallBold">@{preview.username}</ThemedText> : null}
            <ThemedText type="small" numberOfLines={PREVIEW_LINES}>
              {preview.text}
            </ThemedText>
          </View>
        </ThemedView>
      ) : null}

      {report.details ? <ThemedText type="small">“{report.details}”</ThemedText> : null}

      {report.status === 'open' ? (
        <>
          <TextField
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={Limits.reportDetailsMaxLength}
          />
          <FormError message={error} />
          <View style={styles.actions}>
            <Button label="Dismiss" variant="secondary" onPress={() => void act('dismiss')} disabled={busy} />
            {report.targetType === 'account' ? null : (
              <Button label="Remove content" variant="danger" onPress={() => void act('removeContent')} disabled={busy} />
            )}
            <Button label="Suspend account" variant="danger" onPress={() => void act('suspendAccount')} disabled={busy} />
          </View>
        </>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          {[
            report.status === 'resolved' ? 'Resolved' : 'Dismissed',
            report.resolvedAt ? formatRelativeTime(report.resolvedAt, now) : null,
            report.resolutionNote || null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  preview: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.two,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: Spacing.one,
  },
  previewText: {
    flex: 1,
    gap: Spacing.half,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
