import * as React from 'react';
import { NavigationMenu as NavigationPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles } from './style-context';
import { ChevronDown } from 'lucide-react';

export const NavigationMenu = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof NavigationPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationPrimitive.Root> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
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
          'absolute top-full left-1/2 z-40 flex -translate-x-1/2 justify-center pt-2',
          undefined,
          unstyled,
        )}
      >
        <NavigationPrimitive.Viewport
          {...styles(
            'navigation-menu.viewport',
            'ui-popup ui-navigation-viewport h-[var(--radix-navigation-menu-viewport-height)] w-[var(--radix-navigation-menu-viewport-width)] max-w-[calc(100vw-32px)] overflow-hidden rounded-[var(--ui-popover-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-[var(--ui-popover-border,var(--ui-border))] bg-[var(--ui-popover-background,var(--ui-surface))] text-[var(--ui-popover-foreground,var(--ui-foreground))] shadow-[var(--ui-popover-shadow,var(--ui-shadow))]',
            undefined,
            unstyled,
          )}
        />
      </div>
    </NavigationPrimitive.Root>,
    unstyled,
  );
});

NavigationMenu.displayName = 'NavigationMenu';

export const NavigationMenuList = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof NavigationPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationPrimitive.List> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <NavigationPrimitive.List
      ref={ref}
      {...styles('navigation-menu.list', 'flex items-center gap-1', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

NavigationMenuList.displayName = 'NavigationMenuList';

export const NavigationMenuItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof NavigationPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof NavigationPrimitive.Item> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<NavigationPrimitive.Item {...props} ref={ref} />, unstyled);
});

NavigationMenuItem.displayName = 'NavigationMenuItem';

export const NavigationMenuLink = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof NavigationPrimitive.Link>,
  React.ComponentPropsWithoutRef<typeof NavigationPrimitive.Link> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <NavigationPrimitive.Link
      ref={ref}
      {...styles(
        'navigation-menu.link',
        'ui-interactive block rounded-[var(--ui-navigation-radius,var(--ui-radius))] px-3 py-2 text-sm font-medium hover:bg-muted data-[active]:bg-[var(--ui-navigation-active,var(--ui-muted))] data-[active]:text-[var(--ui-navigation-active-foreground,var(--ui-foreground))]',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});

NavigationMenuLink.displayName = 'NavigationMenuLink';

export const NavigationMenuTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof NavigationPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationPrimitive.Trigger> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
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
    </NavigationPrimitive.Trigger>,
    unstyled,
  );
});

NavigationMenuTrigger.displayName = 'NavigationMenuTrigger';

export const NavigationMenuContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof NavigationPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationPrimitive.Content> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <NavigationPrimitive.Content
      ref={ref}
      {...styles(
        'navigation-menu.content',
        'ui-navigation-content absolute top-0 start-0 w-[min(360px,calc(100vw-32px))] max-h-[calc(100dvh-96px)] overflow-y-auto p-2',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});

NavigationMenuContent.displayName = 'NavigationMenuContent';
