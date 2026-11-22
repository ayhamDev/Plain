import { type ResponsiveValue } from './layout';
import { useMediaQuery } from './media-query';
import * as React from 'react';
import { type Range, defaultRangeExtractor, type Virtualizer } from '@tanstack/react-virtual';

export function positive(value: number | undefined, fallback: number) {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
}

export function spacing(value: number) {
  return Math.max(0, Number.isFinite(value) ? value : 0) * 8;
}

export function count(value: number, fallback: number) {
  return Math.max(1, Math.floor(positive(value, fallback)));
}

export function useColumns(value: ResponsiveValue<number>) {
  const base = typeof value === 'number' ? value : (value.base ?? 1);
  const sm = typeof value === 'number' ? value : (value.sm ?? base);
  const md = typeof value === 'number' ? value : (value.md ?? sm);
  const lg = typeof value === 'number' ? value : (value.lg ?? md);
  const responsive = typeof value === 'object';
  const small = useMediaQuery('(min-width: 640px)', responsive);
  const medium = useMediaQuery('(min-width: 768px)', responsive);
  const large = useMediaQuery('(min-width: 1024px)', responsive);
  const matched = large ? 3 : medium ? 2 : small ? 1 : 0;
  return count([base, sm, md, lg][matched], 1);
}

export function useViewport<T>(
  ref: React.ForwardedRef<HTMLDivElement>,
  height: number | string,
  items: readonly T[],
  getItemKey: (item: T, index: number) => React.Key,
  columns = 1,
) {
  const element = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => element.current!, []);
  const [mounted, setMounted] = React.useState(false);
  const [focusedKey, setFocusedKey] = React.useState<React.Key | null>(null);
  React.useEffect(() => setMounted(true), []);
  const rangeExtractor = React.useCallback(
    (range: Range) => {
      const indexes = defaultRangeExtractor(range);
      const itemIndex =
        focusedKey === null
          ? -1
          : items.findIndex((item, index) => getItemKey(item, index) === focusedKey);
      const focusedIndex = itemIndex < 0 ? -1 : Math.floor(itemIndex / columns);
      if (focusedIndex >= 0 && focusedIndex < range.count && !indexes.includes(focusedIndex)) {
        indexes.push(focusedIndex);
        indexes.sort((a, b) => a - b);
      }
      return indexes;
    },
    [focusedKey, items, getItemKey, columns],
  );
  return {
    element,
    mounted,
    rangeExtractor,
    initialRect: { width: 0, height: typeof height === 'number' ? positive(height, 400) : 400 },
    onFocusCapture(event: React.FocusEvent<HTMLDivElement>) {
      const item = (event.target as HTMLElement).closest('[data-index]');
      const index = item ? Number(item.getAttribute('data-index')) : -1;
      setFocusedKey(index >= 0 && index < items.length ? getItemKey(items[index], index) : null);
    },
    onBlurCapture(event: React.FocusEvent<HTMLDivElement>) {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusedKey(null);
    },
  };
}

export function scrollWithKeyboard(
  event: React.KeyboardEvent<HTMLDivElement>,
  virtualizer: Virtualizer<HTMLDivElement, HTMLDivElement>,
) {
  if (event.defaultPrevented || event.target !== event.currentTarget) return;
  if (event.key === 'End') {
    event.preventDefault();
    // Keep following the collection's end while dynamic items are measured.
    virtualizer.scrollToEnd();
    return;
  }
  const page = event.currentTarget.clientHeight || virtualizer.options.initialRect.height;
  const offset = virtualizer.scrollOffset ?? 0;
  const end = Math.max(0, virtualizer.getTotalSize() - page);
  const destinations: Record<string, number> = {
    ArrowDown: offset + 40,
    ArrowUp: offset - 40,
    PageDown: offset + page,
    PageUp: offset - page,
    Home: 0,
  };
  if (Object.hasOwn(destinations, event.key)) {
    event.preventDefault();
    virtualizer.scrollToOffset(Math.min(end, Math.max(0, destinations[event.key])));
  }
}
