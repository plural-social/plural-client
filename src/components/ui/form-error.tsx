import { ThemedText } from '@/components/themed-text';

/** Form-level error, announced to screen readers when it appears. */
export function FormError({ message }: { message: string | undefined }): React.JSX.Element | null {
  if (!message) return null;
  return (
    <ThemedText type="small" themeColor="danger" accessibilityRole="alert" accessibilityLiveRegion="polite">
      {message}
    </ThemedText>
  );
}
