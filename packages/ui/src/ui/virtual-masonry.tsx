import { type VirtualListProps } from './virtual-list';
import { type ResponsiveValue } from './layout';
import * as React from 'react';
import { useStyles, useDirection } from './style-context';
import { useTranslation } from './i18n';
import {
  useColumns,
  useViewport,
  spacing,
  positive,
  scrollWithKeyboard,
  count,
} from './virtual-internal';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface VirtualMasonryProps<T> extends VirtualListProps<T> {
  lanes?: ResponsiveValue<number>;
}

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
  const { t } = useTranslation();
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
  return styles.tooltip(
    <div
      ref={viewport.element}
      role="list"
      aria-label={t('virtual.items')}
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
    </div>,
    unstyled,
  );
}

export const VirtualMasonry = /* @__PURE__ */ React.forwardRef(VirtualMasonryInner) as <T>(
  props: VirtualMasonryProps<T> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement;
