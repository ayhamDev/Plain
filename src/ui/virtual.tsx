import * as React from 'react';
import {
  defaultRangeExtractor,
  useVirtualizer,
  type Range,
  type VirtualItem,
  type Virtualizer,
} from '@tanstack/react-virtual';
import { useDirection, useStyles, type PlainStyleProps } from './styling';
import type { ResponsiveValue } from './layout';

export interface VirtualCollectionProps<T>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>, PlainStyleProps {
  items: readonly T[];
  getItemKey: (item: T, index: number) => React.Key;
  renderItem: (item: T, index: number) => React.ReactNode;
  height?: number | string;
  overscan?: number;
  /** Initial items rendered on the server and while a hidden viewport is unmeasurable. */
  ssrCount?: number;
  /** Gap in 8px units. Virtual positioning requires a numeric gap. */
  gap?: number;
  emptyContent?: React.ReactNode;
}
export interface VirtualListProps<T> extends VirtualCollectionProps<T> {
  estimateSize?: number | ((item: T, index: number) => number);
}
export interface VirtualGridProps<T> extends VirtualCollectionProps<T> {
  columns?: ResponsiveValue<number>;
  rowHeight?: number;
}
export interface VirtualMasonryProps<T> extends VirtualListProps<T> {
  lanes?: ResponsiveValue<number>;
}

function positive(value: number | undefined, fallback: number) {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
}
function spacing(value: number) {
  return Math.max(0, Number.isFinite(value) ? value : 0) * 8;
}
function count(value: number, fallback: number) {
  return Math.max(1, Math.floor(positive(value, fallback)));
}

function useColumns(value: ResponsiveValue<number>) {
  const base = typeof value === 'number' ? value : (value.base ?? 1);
  const sm = typeof value === 'number' ? value : (value.sm ?? base);
  const md = typeof value === 'number' ? value : (value.md ?? sm);
  const lg = typeof value === 'number' ? value : (value.lg ?? md);
  const [matched, setMatched] = React.useState<0 | 1 | 2 | 3>(0);
  React.useEffect(() => {
    const media = [640, 768, 1024].map((width) => window.matchMedia(`(min-width: ${width}px)`));
    const update = () =>
      setMatched(media[2].matches ? 3 : media[1].matches ? 2 : media[0].matches ? 1 : 0);
    update();
    media.forEach((query) => query.addEventListener('change', update));
    return () => media.forEach((query) => query.removeEventListener('change', update));
  }, []);
  return count([base, sm, md, lg][matched], 1);
}

function useViewport<T>(
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

function scrollWithKeyboard(
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

function VirtualListInner<T>(
  {
    items,
    getItemKey,
    renderItem,
    height = 400,
    estimateSize = 48,
    overscan = 5,
    ssrCount = 10,
    gap = 0,
    emptyContent,
    className,
    style,
    unstyled,
    dir,
    onKeyDown,
    onFocusCapture,
    onBlurCapture,
    ...props
  }: VirtualListProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const styles = useStyles();
  const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
  const viewport = useViewport(ref, height, items, getItemKey);
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: items.length,
    getScrollElement: () => viewport.element.current,
    getItemKey: (index) => getItemKey(items[index], index),
    estimateSize: (index) =>
      positive(
        typeof estimateSize === 'function' ? estimateSize(items[index], index) : estimateSize,
        48,
      ),
    overscan: Math.max(0, Math.floor(Number.isFinite(overscan) ? overscan : 5)),
    gap: spacing(gap),
    initialRect: viewport.initialRect,
    enabled: viewport.mounted,
    isRtl: direction === 'rtl',
    rangeExtractor: viewport.rangeExtractor,
    useAnimationFrameWithResizeObserver: true,
  });
  const visible = virtualizer.getVirtualItems();
  const fallback = !viewport.mounted || !visible.length;
  return (
    <div
      ref={viewport.element}
      role="list"
      aria-label="Items"
      tabIndex={0}
      dir={direction}
      {...styles('virtual-list.root', 'ui-virtual-viewport', className, unstyled)}
      style={{ overflow: 'auto', height, contain: 'layout style', ...style }}
      {...props}
      onFocusCapture={(event) => {
        onFocusCapture?.(event);
        viewport.onFocusCapture(event);
      }}
      onBlurCapture={(event) => {
        onBlurCapture?.(event);
        viewport.onBlurCapture(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        scrollWithKeyboard(event, virtualizer);
      }}
    >
      {!items.length ? (
        emptyContent
      ) : (
        <div
          role="presentation"
          {...styles('virtual-list.content', 'ui-virtual-content', undefined, unstyled)}
          style={{
            position: 'relative',
            height: fallback ? undefined : virtualizer.getTotalSize(),
            display: fallback ? 'grid' : undefined,
            gap: spacing(gap),
          }}
        >
          {fallback
            ? items.slice(0, count(ssrCount, 10)).map((item, index) => (
                <div
                  key={getItemKey(item, index)}
                  role="listitem"
                  aria-posinset={index + 1}
                  aria-setsize={items.length}
                  {...styles('virtual-list.item', 'ui-virtual-item', undefined, unstyled)}
                >
                  {renderItem(item, index)}
                </div>
              ))
            : visible.map((item) => (
                <div
                  key={item.key}
                  ref={virtualizer.measureElement}
                  data-index={item.index}
                  role="listitem"
                  aria-posinset={item.index + 1}
                  aria-setsize={items.length}
                  {...styles('virtual-list.item', 'ui-virtual-item', undefined, unstyled)}
                  style={{
                    position: 'absolute',
                    insetInline: 0,
                    top: 0,
                    transform: `translateY(${item.start}px)`,
                  }}
                >
                  {renderItem(items[item.index], item.index)}
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
export const VirtualList = /* @__PURE__ */ React.forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement;

function VirtualGridInner<T>(
  {
    items,
    getItemKey,
    renderItem,
    height = 400,
    columns = { base: 1, sm: 2, lg: 3 },
    rowHeight = 120,
    overscan = 3,
    ssrCount = 12,
    gap = 1,
    emptyContent,
    className,
    style,
    unstyled,
    dir,
    onKeyDown,
    onFocusCapture,
    onBlurCapture,
    ...props
  }: VirtualGridProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const styles = useStyles();
  const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
  const columnCount = useColumns(columns);
  const viewport = useViewport(ref, height, items, getItemKey, columnCount);
  const itemHeight = positive(rowHeight, 120);
  const pixels = spacing(gap);
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: Math.ceil(items.length / columnCount),
    getScrollElement: () => viewport.element.current,
    getItemKey: (index) =>
      `${columnCount}:${String(getItemKey(items[index * columnCount], index * columnCount))}`,
    estimateSize: () => itemHeight,
    gap: pixels,
    overscan: Math.max(0, Math.floor(Number.isFinite(overscan) ? overscan : 3)),
    initialRect: viewport.initialRect,
    enabled: viewport.mounted,
    isRtl: direction === 'rtl',
    rangeExtractor: viewport.rangeExtractor,
  });
  const visible = virtualizer.getVirtualItems();
  const fallback = !viewport.mounted || !visible.length;
  const cell = (item: T, index: number, row?: VirtualItem, column = 0) => (
    <div
      key={getItemKey(item, index)}
      data-index={index}
      data-virtual-row={row?.index}
      role="listitem"
      aria-posinset={index + 1}
      aria-setsize={items.length}
      {...styles('virtual-grid.item', 'ui-virtual-item', undefined, unstyled)}
      style={{
        minWidth: 0,
        overflow: 'auto',
        height: itemHeight,
        ...(row
          ? ({
              position: 'absolute',
              top: 0,
              transform: `translateY(${row.start}px)`,
              insetInlineStart: `calc(${(column * 100) / columnCount}% + ${(column * pixels) / columnCount}px)`,
              width: `calc(${100 / columnCount}% - ${((columnCount - 1) * pixels) / columnCount}px)`,
            } as React.CSSProperties)
          : {}),
      }}
    >
      {renderItem(item, index)}
    </div>
  );
  return (
    <div
      ref={viewport.element}
      role="list"
      aria-label="Items"
      tabIndex={0}
      dir={direction}
      {...styles('virtual-grid.root', 'ui-virtual-viewport', className, unstyled)}
      style={{ overflow: 'auto', height, contain: 'layout style', ...style }}
      {...props}
      onFocusCapture={(event) => {
        onFocusCapture?.(event);
        viewport.onFocusCapture(event);
      }}
      onBlurCapture={(event) => {
        onBlurCapture?.(event);
        viewport.onBlurCapture(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        scrollWithKeyboard(event, virtualizer);
      }}
    >
      {!items.length ? (
        emptyContent
      ) : (
        <div
          role="presentation"
          {...styles('virtual-grid.content', 'ui-virtual-content', undefined, unstyled)}
          style={{
            position: 'relative',
            height: fallback ? undefined : virtualizer.getTotalSize(),
            display: fallback ? 'grid' : undefined,
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
            gap: pixels,
          }}
        >
          {fallback
            ? items.slice(0, count(ssrCount, 12)).map((item, index) => cell(item, index))
            : visible.flatMap((row) =>
                items
                  .slice(row.index * columnCount, (row.index + 1) * columnCount)
                  .map((item, column) => cell(item, row.index * columnCount + column, row, column)),
              )}
        </div>
      )}
    </div>
  );
}
export const VirtualGrid = /* @__PURE__ */ React.forwardRef(VirtualGridInner) as <T>(
  props: VirtualGridProps<T> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement;

function VirtualMasonryInner<T>(
  {
    items,
    getItemKey,
    renderItem,
    height = 480,
    lanes = { base: 1, sm: 2, lg: 3 },
    estimateSize = 200,
    overscan = 6,
    ssrCount = 12,
    gap = 2,
    emptyContent,
    className,
    style,
    unstyled,
    dir,
    onKeyDown,
    onFocusCapture,
    onBlurCapture,
    ...props
  }: VirtualMasonryProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const styles = useStyles();
  const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
  const laneCount = useColumns(lanes);
  const viewport = useViewport(ref, height, items, getItemKey);
  const pixels = spacing(gap);
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: items.length,
    lanes: laneCount,
    getScrollElement: () => viewport.element.current,
    getItemKey: (index) => getItemKey(items[index], index),
    estimateSize: (index) =>
      positive(
        typeof estimateSize === 'function' ? estimateSize(items[index], index) : estimateSize,
        200,
      ),
    gap: pixels,
    overscan: Math.max(0, Math.floor(Number.isFinite(overscan) ? overscan : 6)),
    initialRect: viewport.initialRect,
    enabled: viewport.mounted,
    isRtl: direction === 'rtl',
    rangeExtractor: viewport.rangeExtractor,
    useAnimationFrameWithResizeObserver: true,
  });
  // Engine lanes determine geometry; source order remains the reading and focus order.
  const visible = [...virtualizer.getVirtualItems()].sort((a, b) => a.index - b.index);
  const fallback = !viewport.mounted || !visible.length;
  return (
    <div
      ref={viewport.element}
      role="list"
      aria-label="Items"
      tabIndex={0}
      dir={direction}
      {...styles('virtual-masonry.root', 'ui-virtual-viewport', className, unstyled)}
      style={{ overflow: 'auto', height, contain: 'layout style', ...style }}
      {...props}
      onFocusCapture={(event) => {
        onFocusCapture?.(event);
        viewport.onFocusCapture(event);
      }}
      onBlurCapture={(event) => {
        onBlurCapture?.(event);
        viewport.onBlurCapture(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        scrollWithKeyboard(event, virtualizer);
      }}
    >
      {!items.length ? (
        emptyContent
      ) : (
        <div
          role="presentation"
          {...styles('virtual-masonry.content', 'ui-virtual-content', undefined, unstyled)}
          style={{
            position: 'relative',
            height: fallback ? undefined : virtualizer.getTotalSize(),
            columnCount: fallback ? laneCount : undefined,
            columnGap: pixels,
          }}
        >
          {fallback
            ? items.slice(0, count(ssrCount, 12)).map((item, index) => (
                <div
                  key={getItemKey(item, index)}
                  role="listitem"
                  aria-posinset={index + 1}
                  aria-setsize={items.length}
                  {...styles('virtual-masonry.item', 'ui-virtual-item', undefined, unstyled)}
                  style={{ breakInside: 'avoid', marginBlockEnd: pixels }}
                >
                  {renderItem(item, index)}
                </div>
              ))
            : visible.map((item) => (
                <div
                  key={item.key}
                  ref={virtualizer.measureElement}
                  data-index={item.index}
                  role="listitem"
                  aria-posinset={item.index + 1}
                  aria-setsize={items.length}
                  {...styles('virtual-masonry.item', 'ui-virtual-item', undefined, unstyled)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    transform: `translateY(${item.start}px)`,
                    insetInlineStart: `calc(${(item.lane * 100) / laneCount}% + ${(item.lane * pixels) / laneCount}px)`,
                    width: `calc(${100 / laneCount}% - ${((laneCount - 1) * pixels) / laneCount}px)`,
                  }}
                >
                  {renderItem(items[item.index], item.index)}
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
export const VirtualMasonry = /* @__PURE__ */ React.forwardRef(VirtualMasonryInner) as <T>(
  props: VirtualMasonryProps<T> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement;
