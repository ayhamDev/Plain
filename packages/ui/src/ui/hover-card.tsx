import * as React from 'react';
import { HoverCard as HoverPrimitive } from 'radix-ui';
import {
  type PlainStyleProps,
  StyleProvider,
  useStyles,
  usePortalContainer,
  useDirection,
} from './style-context';

export function HoverCard({
  unstyled,
  children,
  ...props
}: React.ComponentProps<typeof HoverPrimitive.Root> & PlainStyleProps) {
  return (
    <StyleProvider unstyled={unstyled}>
      <HoverPrimitive.Root openDelay={500} {...props}>
        {children}
      </HoverPrimitive.Root>
    </StyleProvider>
  );
}

export const HoverCardTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof HoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof HoverPrimitive.Trigger> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <HoverPrimitive.Trigger
      ref={ref}
      {...styles('hover-card.trigger', 'ui-hover-card-trigger', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

HoverCardTrigger.displayName = 'HoverCardTrigger';

export const HoverCardContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof HoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverPrimitive.Content> & PlainStyleProps
>(({ className, unstyled, dir, ...props }, ref) => {
  const styles = useStyles();

  const container = usePortalContainer();
  const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
  return (
    <HoverPrimitive.Portal container={container}>
      {styles.tooltip(
        <HoverPrimitive.Content
          ref={ref}
          dir={direction}
          sideOffset={8}
          collisionPadding={8}
          {...styles('hover-card.content', 'ui-hover-card-content', className, unstyled)}
          {...props}
        />,
        unstyled,
      )}
    </HoverPrimitive.Portal>
  );
});

HoverCardContent.displayName = 'HoverCardContent';
