import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export type MenuAction = { label: string; destructive?: boolean; onPress: () => void };

type ActionMenuProps = {
  visible: boolean;
  onClose: () => void;
  actions: MenuAction[];
};

const MENU_MAX_WIDTH = 400;
const ROW_MIN_HEIGHT = 48;

/** Bottom sheet of actions for Android and web. iOS uses ActionSheetIOS instead (see useActionMenu). */
export function ActionMenu({ visible, onClose, actions }: ActionMenuProps): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Sibling, not parent, of the sheet: a parent Pressable would swallow the menu for screen readers. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close menu"
          accessibilityRole="button"
        />
        <ThemedView style={styles.sheet} accessibilityRole="menu">
          {actions.map((action) => (
            <Pressable
              key={action.label}
              style={styles.row}
              accessibilityRole="menuitem"
              onPress={() => {
                onClose();
                action.onPress();
              }}>
              <ThemedText themeColor={action.destructive ? 'danger' : 'text'}>{action.label}</ThemedText>
            </Pressable>
          ))}
          <Pressable style={styles.row} accessibilityRole="menuitem" onPress={onClose}>
            <ThemedText themeColor="textSecondary">Cancel</ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    width: '100%',
    maxWidth: MENU_MAX_WIDTH,
    borderTopLeftRadius: Spacing.three,
    borderTopRightRadius: Spacing.three,
    paddingVertical: Spacing.two,
  },
  row: {
    minHeight: ROW_MIN_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
});

