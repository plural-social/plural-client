import { useEffect, useRef, type RefObject } from 'react';
import type { FlatList } from 'react-native';

// A gesture ends after this long without wheel events. Trackpad inertia keeps
// sending events, so one swipe still pages once.
const GESTURE_END_MS = 200;
// Ignores tiny deltas from resting fingers on trackpads.
const MIN_DELTA = 4;

/**
 * Turns each mouse-wheel or trackpad gesture into exactly one page change.
 * CSS scroll snapping alone needs about half a screen of wheel movement before
 * it moves to the next post, so one wheel notch would snap back.
 */
export function useWheelPaging<T>(
  listRef: RefObject<FlatList<T> | null>,
  /** False until the list is mounted; the listener attaches when it turns true. */
  enabled: boolean,
  onPage: (direction: 1 | -1) => void,
): void {
  const onPageRef = useRef(onPage);
  useEffect(() => {
    onPageRef.current = onPage;
  });

  useEffect(() => {
    if (!enabled) return;
    const node: unknown = listRef.current?.getScrollableNode();
    if (!(node instanceof HTMLElement)) return;

    let gestureTimer: ReturnType<typeof setTimeout> | undefined;
    let inGesture = false;

    function handleWheel(event: WheelEvent): void {
      event.preventDefault();
      clearTimeout(gestureTimer);
      gestureTimer = setTimeout(() => {
        inGesture = false;
      }, GESTURE_END_MS);

      if (inGesture || Math.abs(event.deltaY) < MIN_DELTA) return;
      inGesture = true;
      onPageRef.current(event.deltaY > 0 ? 1 : -1);
    }

    node.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      clearTimeout(gestureTimer);
      node.removeEventListener('wheel', handleWheel);
    };
  }, [listRef, enabled]);
}
