import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/client';
import { createReport } from '@/api/moderation';
import type { ReportReason, ReportTargetType } from '@/api/types';
import { REPORT_REASONS } from '@/components/moderation/report-reasons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { TextField } from '@/components/ui/text-field';
import { Limits } from '@/constants/limits';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ReportTarget = { type: ReportTargetType; uuid: string; label: string };

type ReportSheetProps = {
  /** What to report. null hides the sheet. */
  target: ReportTarget | null;
  onClose: () => void;
};

const SHEET_MAX_WIDTH = 480;
const RADIO_SIZE = 20;

function reportErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Something went wrong. Try again.';
  if (error.type === 'invalidReportTarget') return "This can't be reported.";
  if (error.type === 'rateLimited') return "You're sending reports too fast. Try again in a minute.";
  return error.message;
}

export function ReportSheet({ target, onClose }: ReportSheetProps): React.JSX.Element {
  return (
    <Modal visible={target !== null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Keyed by target so each report starts with a fresh form. */}
        {target ? <ReportForm key={`${target.type}:${target.uuid}`} target={target} onClose={onClose} /> : null}
      </View>
    </Modal>
  );
}

function ReportForm({ target, onClose }: { target: ReportTarget; onClose: () => void }): React.JSX.Element {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();

  async function send(): Promise<void> {
    if (!reason) return;
    setSending(true);
    setError(undefined);
    try {
      await createReport({ targetType: target.type, targetUuid: target.uuid, reason, details: details.trim() });
      setSent(true);
    } catch (sendError) {
      setError(reportErrorMessage(sendError));
    } finally {
      setSending(false);
    }
  }

  return (
    <ThemedView style={styles.sheet} accessibilityViewIsModal>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="smallBold" accessibilityRole="header" style={styles.title}>
          Report {target.label}
        </ThemedText>
        {sent ? (
          <>
            <ThemedText accessibilityLiveRegion="polite">Thanks. A moderator will review this.</ThemedText>
            <Button label="Done" onPress={onClose} />
          </>
        ) : (
          <>
            <View accessibilityRole="radiogroup" accessibilityLabel="Reason">
              {REPORT_REASONS.map((option) => (
                <ReasonRow
                  key={option.value}
                  label={option.label}
                  checked={reason === option.value}
                  onPress={() => setReason(option.value)}
                />
              ))}
            </View>
            <TextField
              label="More details (optional)"
              value={details}
              onChangeText={setDetails}
              multiline
              maxLength={Limits.reportDetailsMaxLength}
            />
            <FormError message={error} />
            <Button label="Send report" onPress={() => void send()} loading={sending} disabled={!reason} />
            <Button label="Cancel" variant="secondary" onPress={onClose} />
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function ReasonRow({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }): React.JSX.Element {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked }}
      aria-checked={checked}
      accessibilityLabel={label}
      style={styles.reason}>
      <View style={[styles.radio, { borderColor: checked ? theme.primary : theme.textSecondary }]}>
        {checked ? <View style={[styles.radioDot, { backgroundColor: theme.primary }]} /> : null}
      </View>
      <ThemedText>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Bottom sheet on phones, centered dialog on web.
  backdrop: {
    flex: 1,
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    width: '100%',
    maxWidth: SHEET_MAX_WIDTH,
    maxHeight: '90%',
    borderTopLeftRadius: Spacing.three,
    borderTopRightRadius: Spacing.three,
    borderRadius: Platform.OS === 'web' ? Spacing.three : undefined,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontSize: 18,
  },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 44,
  },
  radio: {
    width: RADIO_SIZE,
    height: RADIO_SIZE,
    borderRadius: RADIO_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: RADIO_SIZE / 2,
    height: RADIO_SIZE / 2,
    borderRadius: RADIO_SIZE / 4,
  },
});
