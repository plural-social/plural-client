import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const BAR_HEIGHT = 8;

/** Determinate progress bar. `fraction` is 0 to 1. */
export function ProgressBar({ fraction, label }: { fraction: number; label: string }): React.JSX.Element {
  const theme = useTheme();
  const percent = Math.round(fraction * 100);

  return (
    <View
      style={[styles.track, { backgroundColor: theme.backgroundSelected }]}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percent }}>
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: theme.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
