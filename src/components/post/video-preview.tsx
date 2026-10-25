import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatDuration } from '@/utils/time';

type VideoPreviewProps = {
  uri: string;
  /** Null when the picker could not read the length. */
  durationMs: number | null;
  style: StyleProp<ViewStyle>;
};

/** Muted, looping preview of a picked video, with native controls. */
export function VideoPreview({ uri, durationMs, style }: VideoPreviewProps): React.JSX.Element {
  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = true;
    p.muted = true;
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  // Some browsers cannot decode some formats (often HEVC .mov from iPhones).
  // The server converts the video anyway, so the upload still works.
  if (status === 'error') {
    return (
      <ThemedView type="backgroundElement" style={[style, styles.unavailable]}>
        <ThemedText type="smallBold">Video selected</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
          This browser can&apos;t preview this video. It will play after it is processed.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={style}>
      <VideoView
        player={player}
        nativeControls
        contentFit="contain"
        style={StyleSheet.absoluteFill}
        accessibilityLabel={durationMs == null ? 'Selected video' : `Selected video, ${formatDuration(durationMs)}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  unavailable: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  centered: {
    textAlign: 'center',
  },
});
