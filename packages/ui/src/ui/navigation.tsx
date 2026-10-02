import { StyleProvider, useStyles, useDirection, type PlainStyleProps } from './styling';
import * as React from 'react';
import {
  Accordion as AccordionPrimitive,
  Tabs as TabsPrimitive,
  Collapsible as CollapsiblePrimitive,
  ScrollArea as ScrollAreaPrimitive,
  NavigationMenu as NavigationPrimitive,
} from 'radix-ui';
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from './utils';
import { Button } from './primitives';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from './i18n';
import { useElasticScroll, type ElasticScrollOptions, type RefreshState } from './elastic-scroll';
export const Accordion = AccordionPrimitive.Root;
export const AccordionItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <AccordionPrimitive.Item
      ref={ref}
      {...styles('accordion.item', 'border-b border-border last:border-b-0', className, unstyled)}
      {...props}
    />
  );
});
AccordionItem.displayName = 'AccordionItem';
export const AccordionTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <AccordionPrimitive.Header {...styles('accordion.header', 'flex', undefined, unstyled)}>
      <AccordionPrimitive.Trigger
        ref={ref}
        {...styles(
          'accordion.trigger',
          'ui-interactive group flex min-h-12 flex-1 items-center justify-between gap-4 py-4 text-start text-sm font-medium hover:text-accent disabled:opacity-45',
          className,
          unstyled,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          {...styles(
            'accordion.icon',
            'ui-motion-transform size-4 shrink-0 text-muted-foreground group-data-[state=open]:rotate-180',
            undefined,
            unstyled,
          )}
          aria-hidden="true"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});
AccordionTrigger.displayName = 'AccordionTrigger';
export const AccordionContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <AccordionPrimitive.Content
      ref={ref}
      {...styles('accordion.content', 'ui-accordion overflow-hidden', className, unstyled)}
      {...props}
    >
      <div
        {...styles(
          'accordion.body',
          'pb-4 text-sm leading-6 text-muted-foreground',
          undefined,
          unstyled,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
});
AccordionContent.displayName = 'AccordionContent';
export const Tabs = TabsPrimitive.Root;
export const TabsList = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  (React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: 'segmented' | 'underline';
  }) &
    PlainStyleProps
>(({ className, variant = 'segmented', unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <TabsPrimitive.List
      ref={ref}
      data-variant={variant}
      {...styles(
        'tabs.list',
        cn(
          'group flex w-fit max-w-full items-center gap-1',
          variant === 'segmented'
            ? 'rounded-[var(--ui-tabs-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-border bg-[var(--ui-tabs-background,var(--ui-muted))] p-1'
            : 'gap-6 border-b border-border',
        ),
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
TabsList.displayName = 'TabsList';
export const TabsTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      {...styles(
        'tabs.trigger',
        'ui-interactive inline-flex min-h-8 items-center justify-center gap-2 rounded-[min(var(--ui-tabs-radius,var(--ui-radius)),4px)] px-3 py-1 text-sm font-medium whitespace-nowrap text-[var(--ui-tabs-foreground,var(--ui-muted-foreground))] hover:text-foreground data-[state=active]:bg-[var(--ui-tabs-active,var(--ui-surface))] data-[state=active]:text-[var(--ui-tabs-active-foreground,var(--ui-foreground))] disabled:pointer-events-none disabled:opacity-45 group-data-[variant=underline]:rounded-none group-data-[variant=underline]:border-b-2 group-data-[variant=underline]:border-transparent group-data-[variant=underline]:px-0 group-data-[variant=underline]:py-3 group-data-[variant=underline]:data-[state=active]:border-foreground group-data-[variant=underline]:data-[state=active]:bg-transparent [&_svg]:size-4',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = 'TabsTrigger';
export const TabsContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <TabsPrimitive.Content
      ref={ref}
      {...styles('tabs.content', 'ui-tab-panel mt-4 outline-offset-4', className, unstyled)}
      {...props}
    />
  );
});
TabsContent.displayName = 'TabsContent';
export const Collapsible = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <StyleProvider unstyled={unstyled}>
      <CollapsiblePrimitive.Root
        ref={ref}
        {...styles('collapsible.root', '', className, unstyled)}
        {...props}
      >
        {children}
      </CollapsiblePrimitive.Root>
    </StyleProvider>
  );
});
Collapsible.displayName = 'Collapsible';
export const CollapsibleTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <CollapsiblePrimitive.Trigger
      ref={ref}
      {...styles('collapsible.trigger', 'ui-interactive', className, unstyled)}
      {...props}
    />
  );
});
CollapsibleTrigger.displayName = 'CollapsibleTrigger';
export const CollapsibleContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <CollapsiblePrimitive.Content
      ref={ref}
      {...styles('collapsible.content', 'ui-collapsible overflow-hidden', className, unstyled)}
      {...props}
    />
  );
});
CollapsibleContent.displayName = 'CollapsibleContent';
export interface ScrollAreaProps
  extends
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>,
    PlainStyleProps,
    ElasticScrollOptions {
  scrollbarVisibility?: 'hover' | 'always' | 'hidden';
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
      elastic,
      onRefresh,
      refreshThreshold,
      onRefreshError,
      renderRefresh,
      type,
      onScroll,
      dir,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const direction = useDirection(dir);
    const viewport = React.useRef<HTMLDivElement>(null);
    const { t } = useTranslation();
    const content = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(viewportRef, () => viewport.current!);
    const refresh = useElasticScroll(viewport, content, {
      elastic,
      onRefresh,
      refreshThreshold,
      onRefreshError,
    });
    const {
      className: viewportClassName,
      unstyled: viewportUnstyled,
      onScroll: onViewportScroll,
      ...nativeViewportProps
    } = viewportProps;
    return (
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
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          ref={viewport}
          tabIndex={0}
          role="region"
          aria-label={props['aria-label']}
          aria-labelledby={props['aria-labelledby']}
          data-orientation={orientation}
          {...styles(
            'scroll-area.viewport',
            'ui-scroll-viewport size-full rounded-[inherit] overscroll-contain outline-offset-[-2px]',
            viewportClassName,
            viewportUnstyled ?? unstyled,
          )}
          {...nativeViewportProps}
          onScroll={(event) => {
            onViewportScroll?.(event);
            onScroll?.(event);
          }}
        >
          <div
            ref={content}
            {...styles('scroll-area.content', 'ui-scroll-content', undefined, unstyled)}
          >
            {children}
          </div>
        </ScrollAreaPrimitive.Viewport>
        {orientation !== 'horizontal' && (
          <ScrollBar
            unstyled={unstyled}
            forceMount={scrollbarVisibility === 'hidden' || undefined}
            style={scrollbarVisibility === 'hidden' ? { display: 'none' } : undefined}
          />
        )}
        {orientation !== 'vertical' && (
          <ScrollBar
            orientation="horizontal"
            unstyled={unstyled}
            forceMount={scrollbarVisibility === 'hidden' || undefined}
            style={scrollbarVisibility === 'hidden' ? { display: 'none' } : undefined}
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
      </ScrollAreaPrimitive.Root>
    );
  },
);
ScrollArea.displayName = 'ScrollArea';
export const ScrollBar = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> & PlainStyleProps
>(({ className, orientation = 'vertical', unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      {...styles(
        'scroll-bar.root',
        cn(
          'ui-scrollbar flex touch-none select-none bg-[var(--ui-scrollbar-track,transparent)] p-0.5',
          orientation === 'vertical'
            ? 'h-full w-[var(--ui-scrollbar-width,8px)] border-s border-transparent'
            : 'h-[var(--ui-scrollbar-width,8px)] flex-col border-t border-transparent',
        ),
        className,
        unstyled,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        {...styles(
          'scroll-bar.thumb',
          'relative flex-1 rounded-full bg-[var(--ui-scrollbar-thumb,var(--ui-input-border))]',
          undefined,
          unstyled,
        )}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
});
ScrollBar.displayName = 'ScrollBar';
export function Breadcrumb({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'nav'> & PlainStyleProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('navigation.breadcrumb')}
      {...styles('breadcrumb.root', 'text-sm text-muted-foreground', className, unstyled)}
      {...props}
    />
  );
}
export function BreadcrumbList({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'ol'> & PlainStyleProps) {
  const styles = useStyles();

  return (
    <ol
      {...styles('breadcrumb.list', 'flex flex-wrap items-center gap-2', className, unstyled)}
      {...props}
    />
  );
}
export function BreadcrumbItem({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'li'> & PlainStyleProps) {
  const styles = useStyles();

  return (
    <li
      {...styles('breadcrumb.item', 'inline-flex items-center gap-2', className, unstyled)}
      {...props}
    />
  );
}
export const BreadcrumbLink = /* @__PURE__ */ React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<'a'> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <a
      ref={ref}
      {...styles(
        'breadcrumb.link',
        'rounded-sm transition-colors hover:text-foreground',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
BreadcrumbLink.displayName = 'BreadcrumbLink';
export function BreadcrumbPage({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'span'> & PlainStyleProps) {
  const styles = useStyles();

  return (
    <span
      aria-current="page"
      {...styles('breadcrumb.page', 'font-medium text-foreground', className, unstyled)}
      {...props}
    />
  );
}
export function BreadcrumbSeparator({ children, ...props }: React.ComponentProps<'li'>) {
  return (
    <li role="presentation" aria-hidden="true" {...props}>
      {children ?? <ChevronRight className="size-3.5 rtl:rotate-180" />}
    </li>
  );
}
export function BreadcrumbEllipsis() {
  const { t } = useTranslation();
  return (
    <span
      className="flex size-5 items-center justify-center"
      aria-label={t('navigation.moreLevels')}
    >
      <MoreHorizontal className="size-4" aria-hidden="true" />
    </span>
  );
}
export interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}
export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
  unstyled,
  ...props
}: PaginationProps & PlainStyleProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const count = Number.isFinite(pageCount) ? Math.max(1, Math.floor(pageCount)) : 1;
  const current = Number.isFinite(page) ? Math.max(1, Math.min(count, Math.floor(page))) : 1;
  const pages = new Set(
    [1, count, current - 1, current, current + 1].filter((p) => p >= 1 && p <= count),
  );
  const sorted = [...pages].sort((a, b) => a - b);
  return (
    <StyleProvider unstyled={unstyled}>
      <nav
        aria-label={t('navigation.pagination')}
        {...styles('pagination.root', 'flex flex-wrap items-center gap-1', className, unstyled)}
        {...props}
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('table.previousPage')}
          disabled={current === 1}
          onClick={() => onPageChange(current - 1)}
        >
          <ChevronLeft className="rtl:rotate-180" aria-hidden="true" />
        </Button>
        {sorted.map((p, i) => (
          <React.Fragment key={p}>
            {i > 0 && p - sorted[i - 1] > 1 && (
              <span
                aria-hidden="true"
                {...styles(
                  'pagination.ellipsis',
                  'flex size-9 items-center justify-center text-muted-foreground',
                  undefined,
                  unstyled,
                )}
              >
                <MoreHorizontal {...styles('pagination.icon', 'size-4', undefined, unstyled)} />
              </span>
            )}
            <Button
              variant={p === current ? 'outline' : 'ghost'}
              size="icon"
              aria-label={`${t('table.page')} ${p}`}
              aria-current={p === current ? 'page' : undefined}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          </React.Fragment>
        ))}
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('table.nextPage')}
          disabled={current === count}
          onClick={() => onPageChange(current + 1)}
        >
          <ChevronRight className="rtl:rotate-180" aria-hidden="true" />
        </Button>
      </nav>
    </StyleProvider>
  );
}
export const NavigationMenu = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof NavigationPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationPrimitive.Root> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <NavigationPrimitive.Root
      ref={ref}
      {...styles(
        'navigation-menu.root',
        'relative flex max-w-max flex-1 items-center text-[var(--ui-navigation-foreground,var(--ui-foreground))]',
        className,
        unstyled,
      )}
      {...props}
    >
      {children}
      <div
        {...styles(
          'navigation-menu.viewport-wrapper',
          'absolute top-full start-0 z-40 flex justify-center',
          undefined,
          unstyled,
        )}
      >
        <NavigationPrimitive.Viewport
          {...styles(
            'navigation-menu.viewport',
            'ui-popup ui-navigation-viewport mt-2 h-[var(--radix-navigation-menu-viewport-height)] w-[var(--radix-navigation-menu-viewport-width)] max-w-[calc(100vw-32px)] overflow-hidden rounded-[var(--ui-popover-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-[var(--ui-popover-border,var(--ui-border))] bg-[var(--ui-popover-background,var(--ui-surface))] shadow-[var(--ui-popover-shadow,var(--ui-shadow))]',
            undefined,
            unstyled,
          )}
        />
      </div>
    </NavigationPrimitive.Root>
  );
});
NavigationMenu.displayName = 'NavigationMenu';
export const NavigationMenuList = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof NavigationPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationPrimitive.List> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <NavigationPrimitive.List
      ref={ref}
      {...styles('navigation-menu.list', 'flex items-center gap-1', className, unstyled)}
      {...props}
    />
  );
});
NavigationMenuList.displayName = 'NavigationMenuList';
export const NavigationMenuItem = NavigationPrimitive.Item;
export const NavigationMenuLink = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof NavigationPrimitive.Link>,
  React.ComponentPropsWithoutRef<typeof NavigationPrimitive.Link> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <NavigationPrimitive.Link
      ref={ref}
      {...styles(
        'navigation-menu.link',
        'ui-interactive block rounded-[var(--ui-navigation-radius,var(--ui-radius))] px-3 py-2 text-sm font-medium hover:bg-muted data-[active]:bg-[var(--ui-navigation-active,var(--ui-muted))] data-[active]:text-[var(--ui-navigation-active-foreground,var(--ui-foreground))]',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
NavigationMenuLink.displayName = 'NavigationMenuLink';
export const NavigationMenuTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof NavigationPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationPrimitive.Trigger> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <NavigationPrimitive.Trigger
      ref={ref}
      {...styles(
        'navigation-menu.trigger',
        'ui-interactive group flex items-center gap-2 rounded-[var(--ui-navigation-radius,var(--ui-radius))] px-3 py-2 text-sm font-medium hover:bg-muted data-[state=open]:bg-[var(--ui-navigation-active,var(--ui-muted))] data-[state=open]:text-[var(--ui-navigation-active-foreground,var(--ui-foreground))]',
        className,
        unstyled,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        {...styles(
          'navigation-menu.indicator',
          'ui-motion-transform size-3.5 group-data-[state=open]:rotate-180',
          undefined,
          unstyled,
        )}
        aria-hidden="true"
      />
    </NavigationPrimitive.Trigger>
  );
});
NavigationMenuTrigger.displayName = 'NavigationMenuTrigger';
export const NavigationMenuContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof NavigationPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationPrimitive.Content> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return (
    <NavigationPrimitive.Content
      ref={ref}
      {...styles(
        'navigation-menu.content',
        'ui-navigation-content absolute top-0 start-0 w-[min(360px,calc(100vw-32px))] max-h-[calc(100dvh-96px)] overflow-y-auto p-2',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
NavigationMenuContent.displayName = 'NavigationMenuContent';
