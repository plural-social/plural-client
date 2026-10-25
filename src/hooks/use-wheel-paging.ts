import type { RefObject } from 'react';
import type { FlatList } from 'react-native';

/** Web-only (see use-wheel-paging.web.ts). Touch platforms page by swiping. */
export function useWheelPaging<T>(
  _listRef: RefObject<FlatList<T> | null>,
  _enabled: boolean,
  _onPage: (direction: 1 | -1) => void,
): void {}
