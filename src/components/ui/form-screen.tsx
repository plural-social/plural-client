import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const DEFAULT_MAX_WIDTH = 400;

type FormScreenProps = {
  children: React.ReactNode;
  /** Width cap in points; keeps forms readable on web. */
  maxWidth?: number;
};

/** Centered, keyboard-aware column for forms. Inputs stay above the keyboard on iOS. */
export function FormScreen({ children, maxWidth = DEFAULT_MAX_WIDTH }: FormScreenProps): React.JSX.Element {
  return (
    <ThemedView style={styles.fill}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.form, { maxWidth }]}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  form: {
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.three,
  },
});
