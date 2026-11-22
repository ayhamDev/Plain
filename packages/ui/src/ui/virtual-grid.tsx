import { type VirtualCollectionProps } from './virtual-collection';
import { type ResponsiveValue } from './layout';
import * as React from 'react';
import { useStyles, useDirection } from './style-context';
import { useTranslation } from './i18n';
import {
  useColumns,
  useViewport,
  positive,
  spacing,
  scrollWithKeyboard,
  count,
} from './virtual-internal';
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';

export interface VirtualGridProps<T> extends VirtualCollectionProps<T> {
  columns?: ResponsiveValue<number>;
  rowHeight?: number;
}

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
  const { t } = useTranslation();
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
  return styles.tooltip(
    <div
      ref={viewport.element}
      role="list"
      aria-label={t('virtual.items')}
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
    </div>,
    unstyled,
  );
}

export const VirtualGrid = /* @__PURE__ */ React.forwardRef(VirtualGridInner) as <T>(
  props: VirtualGridProps<T> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement;
