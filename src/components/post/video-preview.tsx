import { useVideoPlayer, VideoView } from 'expo-video';
import type { StyleProp, ViewStyle } from 'react-native';

import { formatDuration } from '@/utils/time';

type VideoPreviewProps = {
  uri: string;
  durationMs: number;
  style: StyleProp<ViewStyle>;
};

/** Muted, looping preview of a picked video, with native controls. */
export function VideoPreview({ uri, durationMs, style }: VideoPreviewProps): React.JSX.Element {
  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = true;
    p.muted = true;
  });

  return (
    <VideoView
      player={player}
      nativeControls
      contentFit="contain"
      style={style}
      accessibilityLabel={`Selected video, ${formatDuration(durationMs)}`}
    />
  );
}
