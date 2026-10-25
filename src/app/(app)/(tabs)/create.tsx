import { Image } from 'expo-image';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
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
  const { state, caption, setCaption, error, pick, clear, submit } = useCreatePost();
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  if (state.step === 'preparing') return <LoadingView />;

  if (state.step === 'empty') {
    return (
      <FormScreen maxWidth={CONTENT_MAX_WIDTH}>
        <Pressable
          onPress={() => void pick()}
          accessibilityRole="button"
          accessibilityLabel="Choose a photo to post"
          style={[styles.picker, { borderColor: theme.textSecondary }]}>
          <ThemedText type="subtitle">Choose a photo</ThemedText>
        </Pressable>
        <FormError message={error ?? undefined} />
      </FormScreen>
    );
  }

  const { file } = state.draft;
  const busy = state.step === 'uploading' || state.step === 'posting';

  return (
    <FormScreen maxWidth={CONTENT_MAX_WIDTH}>
      <Image
        source={file.uri}
        contentFit="contain"
        accessibilityLabel="Selected photo"
        style={{
          width: '100%',
          aspectRatio: file.width / file.height,
          maxHeight: windowHeight * PREVIEW_MAX_HEIGHT_FRACTION,
        }}
      />
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
