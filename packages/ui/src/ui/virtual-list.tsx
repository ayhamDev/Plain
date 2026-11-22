import { type VirtualCollectionProps } from './virtual-collection';
import * as React from 'react';
import { useStyles, useDirection } from './style-context';
import { useTranslation } from './i18n';
import { useViewport, positive, spacing, scrollWithKeyboard, count } from './virtual-internal';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface VirtualListProps<T> extends VirtualCollectionProps<T> {
  estimateSize?: number | ((item: T, index: number) => number);
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
  const { t } = useTranslation();
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
  return styles.tooltip(
    <div
      ref={viewport.element}
      role="list"
      aria-label={t('virtual.items')}
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
    </div>,
    unstyled,
  );
}

export const VirtualList = /* @__PURE__ */ React.forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & React.RefAttributes<HTMLDivElement>,
) => React.ReactElement;
