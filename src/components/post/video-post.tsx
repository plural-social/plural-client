import Ionicons from '@expo/vector-icons/Ionicons';
import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Post } from '@/api/types';
import { usePlayback } from '@/components/post/playback-context';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { formatDuration } from '@/utils/time';

type VideoPostProps = {
  post: Post;
  /** True while this post is on screen, focused and the app is in the foreground. */
  isActive: boolean;
};

const PLAY_ICON_SIZE = 72;
const PROGRESS_HEIGHT = 3;
const TIME_UPDATE_INTERVAL_SECONDS = 0.25;

/**
 * A feed video: plays and loops while active, restarts from the beginning when
 * it becomes active again. Its player exists only while the post is near the
 * screen (see PostMedia), so at most three players are alive at once.
 */
export function VideoPost({ post, isActive }: VideoPostProps): React.JSX.Element {
  const { media, author } = post;
  const { muted } = usePlayback();
  const source = { uri: media.url, useCaching: true };
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = muted;
    p.timeUpdateEventInterval = TIME_UPDATE_INTERVAL_SECONDS;
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { currentTime } = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });

  // The player is a native object controlled by setting its properties (as in
  // the expo-video docs); the compiler's immutability rule does not apply.
  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
      // Restart from the beginning when the user scrolls back.
      // eslint-disable-next-line react-hooks/immutability
      player.currentTime = 0;
    }
  }, [isActive, player]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    player.muted = muted;
  }, [muted, player]);

  const duration = player.duration;
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
      {/* The poster covers the view until the first frame, so there is never a black flash. */}
      {status === 'readyToPlay' ? null : (
        <Image source={{ uri: media.thumbnailUrl }} contentFit="contain" style={StyleSheet.absoluteFill} />
      )}

      <Pressable
        style={[StyleSheet.absoluteFill, styles.center]}
        onPress={() => (player.playing ? player.pause() : player.play())}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}
        accessibilityHint={`Video by @${author.username}, ${formatDuration(media.durationMs)}`}>
        {isActive && !isPlaying && status === 'readyToPlay' ? (
          <Ionicons name="play" size={PLAY_ICON_SIZE} color="rgba(255,255,255,0.8)" />
        ) : null}
      </Pressable>

      {status === 'error' ? (
        <View style={[StyleSheet.absoluteFill, styles.center, styles.error]}>
          <Text style={styles.errorText}>Can&apos;t play this video.</Text>
          <Button label="Try again" variant="secondary" onPress={() => void player.replaceAsync(source)} />
        </View>
      ) : null}

      {progress === null ? null : (
        <View style={styles.progressTrack} pointerEvents="none">
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    gap: Spacing.three,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: PROGRESS_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
});
