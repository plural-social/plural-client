import { createContext, use, useMemo, useState } from 'react';
import { Platform } from 'react-native';

type PlaybackContextValue = {
  muted: boolean;
  toggleMuted: () => void;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

/**
 * Holds the feed's mute setting, shared by every video. Starts muted on web,
 * where browsers block autoplay with sound, and unmuted on native.
 */
export function PlaybackProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [muted, setMuted] = useState(Platform.OS === 'web');
  const value = useMemo(() => ({ muted, toggleMuted: () => setMuted((m) => !m) }), [muted]);
  return <PlaybackContext value={value}>{children}</PlaybackContext>;
}

export function usePlayback(): PlaybackContextValue {
  const value = use(PlaybackContext);
  if (!value) throw new Error('usePlayback must be used inside PlaybackProvider');
  return value;
}
