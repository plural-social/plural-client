import { Image } from 'expo-image';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { VideoPreview } from '@/components/post/video-preview';
import { FormScreen } from '@/components/ui/form-screen';
import { LoadingView } from '@/components/ui/loading-view';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TextField } from '@/components/ui/text-field';
import { Limits } from '@/constants/limits';
import { Spacing } from '@/constants/theme';
import { useCreatePost } from '@/hooks/use-create-post';
import { useTheme } from '@/hooks/use-theme';

const CONTENT_MAX_WIDTH = 600;
const PREVIEW_MAX_HEIGHT_FRACTION = 0.6;

export default function CreateScreen(): React.JSX.Element {
  const { state, caption, setCaption, error, needsSettings, openSettings, pick, clear, submit } = useCreatePost();
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  if (state.step === 'preparing') return <LoadingView />;

  if (state.step === 'empty') {
    return (
      <FormScreen maxWidth={CONTENT_MAX_WIDTH}>
        <Pressable
          onPress={() => void pick()}
          accessibilityRole="button"
          accessibilityLabel="Choose a photo or video"
          style={[styles.picker, { borderColor: theme.textSecondary }]}>
          <ThemedText type="subtitle" style={styles.pickerText}>
            Choose a photo or video
          </ThemedText>
        </Pressable>
        <FormError message={error ?? undefined} />
        {needsSettings ? <Button label="Open Settings" variant="secondary" onPress={openSettings} /> : null}
      </FormScreen>
    );
  }

  const { draft } = state;
  const busy = state.step === 'uploading' || state.step === 'posting';
  const size = draft.kind === 'image' ? draft.file : draft;
  const previewStyle = {
    width: '100%' as const,
    aspectRatio: size.width > 0 && size.height > 0 ? size.width / size.height : 9 / 16,
    maxHeight: windowHeight * PREVIEW_MAX_HEIGHT_FRACTION,
  };

  return (
    <FormScreen maxWidth={CONTENT_MAX_WIDTH}>
      {draft.kind === 'image' ? (
        <Image source={draft.file.uri} contentFit="contain" accessibilityLabel="Selected photo" style={previewStyle} />
      ) : (
        <>
          <VideoPreview uri={draft.uri} durationMs={draft.durationMs} style={previewStyle} />
          <ThemedText type="small" themeColor="textSecondary">
            Videos are processed after upload. It can take a minute before others can see it.
          </ThemedText>
        </>
      )}
      {busy ? null : <Button label="Remove" variant="secondary" onPress={clear} />}
      <TextField
        label="Caption"
        value={caption}
        onChangeText={setCaption}
        multiline
        maxLength={Limits.captionMaxLength}
        helperText={`${caption.length} / ${Limits.captionMaxLength}`}
      />
      <FormError message={error ?? undefined} />
      <Button label="Post" onPress={() => void submit()} loading={busy} disabled={busy} />
      {state.step === 'uploading' ? <UploadStatus progress={state.progress} /> : null}
      {state.step === 'posting' ? <ThemedText type="small">Posting…</ThemedText> : null}
    </FormScreen>
  );
}

/** Progress bar and text for an upload. `progress` is null when it cannot be measured (web). */
function UploadStatus({ progress }: { progress: number | null }): React.JSX.Element {
  if (progress === null) return <ThemedText type="small">Uploading…</ThemedText>;
  return (
    <View style={styles.status}>
      <ProgressBar fraction={progress} label="Upload progress" />
      <ThemedText type="small">Uploading {Math.round(progress * 100)}%</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerText: {
    textAlign: 'center',
  },
  picker: {
    minHeight: 240,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  status: {
    gap: Spacing.one,
  },
});
