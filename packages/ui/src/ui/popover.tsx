import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles, useDirection, usePortalContainer } from './style-context';

export const Popover = PopoverPrimitive.Root;

export const PopoverTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<PopoverPrimitive.Trigger {...props} ref={ref} />, unstyled);
});

PopoverTrigger.displayName = 'PopoverTrigger';

export const PopoverAnchor = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Anchor>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Anchor> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<PopoverPrimitive.Anchor {...props} ref={ref} />, unstyled);
});

PopoverAnchor.displayName = 'PopoverAnchor';

export const PopoverClose = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Close> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<PopoverPrimitive.Close {...props} ref={ref} />, unstyled);
});

PopoverClose.displayName = 'PopoverClose';

export const PopoverContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & PlainStyleProps
>(
  (
    {
      className,
      align = 'center',
      sideOffset = 8,
      collisionPadding = 8,
      sticky = 'always',
      unstyled,
      dir: localDirection,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const dir = useDirection(
      localDirection === 'rtl' || localDirection === 'ltr' ? localDirection : undefined,
    );
    return (
      <PopoverPrimitive.Portal container={usePortalContainer()}>
        {styles.tooltip(
          <PopoverPrimitive.Content
            ref={ref}
            dir={dir}
            align={align}
            sideOffset={sideOffset}
            collisionPadding={collisionPadding}
            sticky={sticky}
            {...styles(
              'popover.content',
              'ui-popup z-[var(--ui-layer-dropdown)] max-w-[min(calc(100vw-32px),var(--radix-popover-content-available-width))] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto overscroll-contain rounded-[var(--ui-popover-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-[var(--ui-popover-border,var(--ui-border))] bg-[var(--ui-popover-background,var(--ui-surface))] p-4 text-[var(--ui-popover-foreground,var(--ui-foreground))] shadow-[var(--ui-popover-shadow,var(--ui-shadow))] outline-none',
              className,
              unstyled,
            )}
            {...props}
          />,
          unstyled,
        )}
      </PopoverPrimitive.Portal>
    );
  },
);

PopoverContent.displayName = 'PopoverContent';
