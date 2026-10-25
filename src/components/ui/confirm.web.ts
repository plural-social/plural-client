type ConfirmInput = { title: string; message: string; confirmLabel: string };

/** Alert.alert does nothing on web, so web uses the browser dialog. */
export async function confirm({ title, message }: ConfirmInput): Promise<boolean> {
  return window.confirm(`${title}\n\n${message}`);
}
