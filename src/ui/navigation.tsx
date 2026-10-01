import { StyleProvider, useStyles, type PlainStyleProps } from './styling';
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
          'group flex min-h-12 flex-1 items-center justify-between gap-4 py-4 text-start text-sm font-medium hover:text-accent disabled:opacity-45',
          className,
          unstyled,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          {...styles(
            'accordion.icon',
            'size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180',
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
            ? 'rounded-ui border border-border bg-muted p-1'
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
        'inline-flex min-h-8 items-center justify-center gap-2 rounded-[min(var(--ui-radius),4px)] px-3 py-1 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-surface data-[state=active]:text-foreground disabled:pointer-events-none disabled:opacity-45 group-data-[variant=underline]:rounded-none group-data-[variant=underline]:border-b-2 group-data-[variant=underline]:border-transparent group-data-[variant=underline]:px-0 group-data-[variant=underline]:py-3 group-data-[variant=underline]:data-[state=active]:border-foreground group-data-[variant=underline]:data-[state=active]:bg-transparent [&_svg]:size-4',
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
      {...styles('tabs.content', 'mt-4 outline-offset-4', className, unstyled)}
      {...props}
    />
  );
});
TabsContent.displayName = 'TabsContent';
export const Collapsible = CollapsiblePrimitive.Root;
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger;
export const CollapsibleContent = CollapsiblePrimitive.Content;
export const ScrollArea = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      {...styles('scroll-area.root', 'relative overflow-hidden', className, unstyled)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        {...styles(
          'scroll-area.viewport',
          'size-full rounded-[inherit] outline-offset-[-2px]',
          undefined,
          unstyled,
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
});
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
          'flex touch-none select-none p-0.5 transition-colors',
          orientation === 'vertical'
            ? 'h-full w-2 border-l border-transparent'
            : 'h-2 flex-col border-t border-transparent',
        ),
        className,
        unstyled,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        {...styles(
          'scroll-bar.thumb',
          'relative flex-1 rounded-full bg-input-border/60',
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
  return (
    <nav
      aria-label="Breadcrumb"
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
  return (
    <span className="flex size-5 items-center justify-center" aria-label="More levels">
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
  const count = Number.isFinite(pageCount) ? Math.max(1, Math.floor(pageCount)) : 1;
  const current = Number.isFinite(page) ? Math.max(1, Math.min(count, Math.floor(page))) : 1;
  const pages = new Set(
    [1, count, current - 1, current, current + 1].filter((p) => p >= 1 && p <= count),
  );
  const sorted = [...pages].sort((a, b) => a - b);
  return (
    <StyleProvider unstyled={unstyled}>
      <nav
        aria-label="Pagination"
        {...styles('pagination.root', 'flex flex-wrap items-center gap-1', className, unstyled)}
        {...props}
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous page"
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
              aria-label={`Page ${p}`}
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
          aria-label="Next page"
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
        'relative flex max-w-max flex-1 items-center',
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
            'ui-popup mt-2 h-[var(--radix-navigation-menu-viewport-height)] w-[var(--radix-navigation-menu-viewport-width)] overflow-hidden rounded-ui border bg-surface shadow-popover transition-[width,height]',
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
        'block rounded-ui px-3 py-2 text-sm font-medium hover:bg-muted',
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
        'group flex items-center gap-2 rounded-ui px-3 py-2 text-sm font-medium hover:bg-muted data-[state=open]:bg-muted',
        className,
        unstyled,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        {...styles(
          'navigation-menu.indicator',
          'size-3.5 transition-transform group-data-[state=open]:rotate-180',
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
        'top-0 start-0 w-[min(360px,calc(100vw-32px))] p-2 md:absolute',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
NavigationMenuContent.displayName = 'NavigationMenuContent';
