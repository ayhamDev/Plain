import * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles } from './style-context';
import { useSelectionIndicator } from './selection-indicator';
import { cn } from './utils';
import { type LayoutPresenceProps, useLayoutPresence } from './layout-presence';

export const Tabs = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<TabsPrimitive.Root {...props} ref={ref} />, unstyled);
});

Tabs.displayName = 'Tabs';

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>, PlainStyleProps {
  variant?: 'segmented' | 'underline';
  animated?: boolean;
  fullWidth?: boolean;
  scrollable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Underline thickness in pixels. The theme token supplies the default. */
  indicatorThickness?: number;
}

export const TabsList = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(
  (
    {
      className,
      variant = 'segmented',
      animated = true,
      fullWidth = false,
      scrollable = false,
      size = 'md',
      indicatorThickness,
      style,
      unstyled,
      children,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const root = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => root.current!);
    useSelectionIndicator(
      root,
      '[role="tab"][data-state="active"]',
      animated && !(unstyled ?? styles.unstyled),
      scrollable,
    );

    return styles.tooltip(
      <TabsPrimitive.List
        ref={root}
        data-variant={variant}
        data-size={size}
        data-scrollable={scrollable || undefined}
        data-full-width={fullWidth || undefined}
        {...styles(
          'tabs.list',
          cn(
            'ui-tabs-list group flex min-w-0 max-w-full items-center gap-1',
            fullWidth ? 'w-full' : 'w-fit',
            variant === 'segmented'
              ? 'rounded-[var(--ui-tabs-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-border bg-[var(--ui-tabs-background,var(--ui-muted))] p-1'
              : 'gap-6 border-b border-[var(--ui-tabs-border,var(--ui-border))]',
          ),
          className,
          unstyled,
        )}
        style={
          {
            ...(indicatorThickness !== undefined && Number.isFinite(indicatorThickness)
              ? { '--ui-tabs-indicator-thickness': `${Math.max(0, indicatorThickness)}px` }
              : {}),
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
        <span
          aria-hidden="true"
          {...styles('tabs.indicator', 'ui-selection-indicator', undefined, unstyled)}
        />
      </TabsPrimitive.List>,
      unstyled,
    );
  },
);

TabsList.displayName = 'TabsList';

export const TabsTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <TabsPrimitive.Trigger
      ref={ref}
      {...styles(
        'tabs.trigger',
        'ui-tabs-trigger ui-interactive inline-flex items-center justify-center gap-2 rounded-[min(var(--ui-tabs-radius,var(--ui-radius)),4px)] font-medium whitespace-nowrap text-[var(--ui-tabs-foreground,var(--ui-muted-foreground))] hover:text-foreground data-[state=active]:text-[var(--ui-tabs-active-foreground,var(--ui-foreground))] disabled:pointer-events-none disabled:opacity-45 group-data-[variant=underline]:rounded-none [&_svg]:size-4',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});

TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> &
    PlainStyleProps &
    LayoutPresenceProps
>(({ className, unstyled, presence, children, asChild, ...props }, ref) => {
  const styles = useStyles();
  const scope = useLayoutPresence(children, presence, ref, asChild);

  return styles.tooltip(
    <TabsPrimitive.Content
      ref={scope.ref}
      children={scope.children}
      asChild={asChild}
      {...styles('tabs.content', 'ui-tab-panel mt-4 outline-offset-4', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

TabsContent.displayName = 'TabsContent';
