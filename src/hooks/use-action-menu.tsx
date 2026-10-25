import { useState } from 'react';
import { ActionSheetIOS, Platform } from 'react-native';

import { ActionMenu, type MenuAction } from '@/components/ui/action-menu';

/**
 * Shows a list of actions: the native action sheet on iOS, ActionMenu
 * elsewhere. Render `menu` somewhere in the tree; it is null on iOS.
 */
export function useActionMenu(): { open: (actions: MenuAction[]) => void; menu: React.JSX.Element | null } {
  const [actions, setActions] = useState<MenuAction[] | null>(null);

  function open(next: MenuAction[]): void {
    if (Platform.OS !== 'ios') {
      setActions(next);
      return;
    }
    const cancelButtonIndex = next.length;
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...next.map((action) => action.label), 'Cancel'],
        cancelButtonIndex,
        destructiveButtonIndex: next.flatMap((action, index) => (action.destructive ? [index] : [])),
      },
      (index) => {
        if (index !== cancelButtonIndex) next[index]?.onPress();
      },
    );
  }

  const menu =
    Platform.OS === 'ios' ? null : (
      <ActionMenu visible={actions !== null} onClose={() => setActions(null)} actions={actions ?? []} />
    );
  return { open, menu };
}
