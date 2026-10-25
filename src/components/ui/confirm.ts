import { Alert } from 'react-native';

type ConfirmInput = { title: string; message: string; confirmLabel: string };

/** Asks the user to confirm a destructive action. Resolves true when confirmed. */
export function confirm({ title, message, confirmLabel }: ConfirmInput): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      // Android: tapping outside the dialog dismisses it.
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
