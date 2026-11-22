import * as React from 'react';
import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles, useDirection } from './style-context';
import { type ElasticScrollOptions, type RefreshState, useElasticScroll } from './elastic-scroll';
import { type LayoutPresenceProps, useLayoutPresence } from './layout-presence';
import {
  type ScrollAreaFadeOptions,
  useScrollAreaFades,
  scrollAreaLength,
  fadeIntensity,
} from './scroll-area-effects';
import { useTranslation } from './i18n';
import { useScrollAreaElastic } from './scroll-area-elastic';
import { RefreshCw } from 'lucide-react';
import { cn } from './utils';

export interface ScrollAreaProps
  extends
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>,
    PlainStyleProps,
    ElasticScrollOptions,
    LayoutPresenceProps {
  scrollbarVisibility?: 'hover' | 'always' | 'hidden';
  scrollbarExpandOnHover?: boolean;
  scrollbarSize?: number | string;
  scrollbarHoverSize?: number | string;
  fadeEdges?: boolean | ScrollAreaFadeOptions;
  renderRefresh?: (state: RefreshState, refresh: () => Promise<void>) => React.ReactNode;
  orientation?: 'vertical' | 'horizontal' | 'both';
  viewportProps?: React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Viewport> &
    PlainStyleProps;
  viewportRef?: React.Ref<React.ElementRef<typeof ScrollAreaPrimitive.Viewport>>;
}

export const ScrollArea = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(
  (
    {
      className,
      children,
      unstyled,
      orientation = 'vertical',
      viewportProps = {},
      viewportRef,
      scrollbarVisibility = 'hover',
      scrollbarExpandOnHover = true,
      scrollbarSize,
      scrollbarHoverSize,
      fadeEdges = false,
      elastic,
      onRefresh,
      refreshThreshold,
      onRefreshError,
      renderRefresh,
      type,
      onScroll,
      dir,
      style,
      presence,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const direction = useDirection(dir);
    const viewport = React.useRef<HTMLDivElement>(null);
    const { t } = useTranslation();
    const content = React.useRef<HTMLDivElement>(null);
    const scope = useLayoutPresence<HTMLDivElement>(children, presence);
    const presenceRef = scope.ref;
    const assignContent = React.useCallback(
      (node: HTMLDivElement | null) => {
        content.current = node;
        presenceRef(node);
      },
      [presenceRef],
    );
    const fade = fadeEdges && typeof fadeEdges === 'object' ? fadeEdges : {};
    const fadeEdgesKey = (
      fade.edges ??
      (orientation === 'vertical'
        ? ['top', 'bottom']
        : orientation === 'horizontal'
          ? ['start', 'end']
          : ['top', 'bottom', 'start', 'end'])
    ).join(' ');
    const threshold = Number.isFinite(fade.threshold) ? Math.max(0, fade.threshold!) : 1;
    useScrollAreaFades(
      viewport,
      content,
      direction,
      !!fadeEdges,
      fadeEdgesKey,
      fade.mode ?? 'scroll',
      threshold,
    );
    React.useImperativeHandle(viewportRef, () => viewport.current!);
    const refresh = useElasticScroll(viewport, content, {
      onRefresh,
      refreshThreshold,
      onRefreshError,
    });
    const {
      className: viewportClassName,
      unstyled: viewportUnstyled,
      onScroll: onViewportScroll,
      onWheel: onViewportWheel,
      ...nativeViewportProps
    } = viewportProps;
    const onElasticWheel = useScrollAreaElastic(viewport, !!elastic, orientation, direction);
    return styles.tooltip(
      <ScrollAreaPrimitive.Root
        ref={ref}
        dir={direction}
        type={type ?? (scrollbarVisibility === 'always' ? 'always' : 'hover')}
        aria-busy={refresh.state === 'refreshing' || undefined}
        {...styles(
          'scroll-area.root',
          'ui-scroll-root relative min-h-0 min-w-0 overflow-hidden',
          className,
          unstyled,
        )}
        style={
          {
            ...(scrollbarSize !== undefined
              ? { '--ui-scrollbar-width': scrollAreaLength(scrollbarSize) }
              : {}),
            ...(scrollbarHoverSize !== undefined
              ? { '--ui-scrollbar-hover-width': scrollAreaLength(scrollbarHoverSize) }
              : {}),
            ...(fade.size !== undefined
              ? { '--ui-scroll-area-fade-size': scrollAreaLength(fade.size) }
              : {}),
            ...(fade.intensity !== undefined
              ? { '--ui-scroll-area-fade-intensity': fadeIntensity(fade.intensity) }
              : {}),
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          ref={viewport}
          tabIndex={0}
          role="region"
          aria-label={props['aria-label']}
          aria-labelledby={props['aria-labelledby']}
          data-orientation={orientation}
          data-fade-edges={fadeEdges ? '' : undefined}
          {...styles(
            'scroll-area.viewport',
            'ui-scroll-viewport size-full rounded-[inherit] overscroll-contain outline-offset-[-2px]',
            viewportClassName,
            viewportUnstyled ?? unstyled,
          )}
          {...nativeViewportProps}
          onWheel={
            elastic
              ? (event) => {
                  onViewportWheel?.(event);
                  onElasticWheel(event);
                }
              : onViewportWheel
          }
          onScroll={(event) => {
            onViewportScroll?.(event);
            onScroll?.(event);
          }}
        >
          <div
            ref={assignContent}
            {...styles('scroll-area.content', 'ui-scroll-content', undefined, unstyled)}
          >
            {scope.children}
          </div>
        </ScrollAreaPrimitive.Viewport>
        {orientation !== 'horizontal' && (
          <ScrollBar
            expandOnHover={scrollbarExpandOnHover}
            unstyled={unstyled}
            forceMount={scrollbarVisibility === 'hidden' || undefined}
            style={scrollbarVisibility === 'hidden' ? { display: 'none' } : undefined}
          />
        )}
        {orientation !== 'vertical' && (
          <ScrollBar
            orientation="horizontal"
            expandOnHover={scrollbarExpandOnHover}
            unstyled={unstyled}
            forceMount={scrollbarVisibility === 'hidden' || undefined}
            style={scrollbarVisibility === 'hidden' ? { display: 'none' } : undefined}
          />
        )}
        {orientation === 'both' && (
          <ScrollAreaPrimitive.Corner
            {...styles(
              'scroll-area.corner',
              'bg-[var(--ui-scrollbar-track,transparent)]',
              undefined,
              unstyled,
            )}
          />
        )}
        {onRefresh && (
          <div
            {...styles('scroll-area.refresh', 'ui-scroll-refresh', undefined, unstyled)}
            data-state={refresh.state}
            aria-live="polite"
          >
            {renderRefresh ? (
              renderRefresh(refresh.state, refresh.refresh)
            ) : (
              <button
                type="button"
                disabled={refresh.state === 'refreshing'}
                onClick={() => void refresh.refresh()}
              >
                <RefreshCw aria-hidden="true" />
                {t(
                  refresh.state === 'ready'
                    ? 'scroll.release'
                    : refresh.state === 'refreshing'
                      ? 'scroll.refreshing'
                      : refresh.state === 'error'
                        ? 'scroll.failed'
                        : 'scroll.pull',
                )}
              </button>
            )}
          </div>
        )}
      </ScrollAreaPrimitive.Root>,
      unstyled,
    );
  },
);

ScrollArea.displayName = 'ScrollArea';

export interface ScrollBarProps
  extends
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
    PlainStyleProps {
  expandOnHover?: boolean;
  size?: number | string;
  hoverSize?: number | string;
}

export const ScrollBar = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  ScrollBarProps
>(
  (
    {
      className,
      orientation = 'vertical',
      expandOnHover = true,
      size,
      hoverSize,
      style,
      unstyled,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();

    return styles.tooltip(
      <ScrollAreaPrimitive.ScrollAreaScrollbar
        ref={ref}
        orientation={orientation}
        data-expand-on-hover={expandOnHover}
        {...styles(
          'scroll-bar.root',
          cn(
            'ui-scrollbar flex touch-none select-none bg-[var(--ui-scrollbar-track,transparent)] p-[2px]',
            orientation === 'horizontal' && 'flex-col',
          ),
          className,
          unstyled,
        )}
        style={
          {
            ...(size !== undefined ? { '--ui-scrollbar-width': scrollAreaLength(size) } : {}),
            ...(hoverSize !== undefined
              ? { '--ui-scrollbar-hover-width': scrollAreaLength(hoverSize) }
              : {}),
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        <ScrollAreaPrimitive.ScrollAreaThumb
          {...styles(
            'scroll-bar.thumb',
            'ui-scrollbar-thumb relative flex-1 bg-[var(--ui-scrollbar-thumb,var(--ui-input-border))]',
            undefined,
            unstyled,
          )}
        />
      </ScrollAreaPrimitive.ScrollAreaScrollbar>,
      unstyled,
    );
  },
);

ScrollBar.displayName = 'ScrollBar';
