import * as React from 'react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { useStyles, usePortalContainer, type PlainStyleProps } from './styling';
import {
  TooltipSettingsContext,
  useTooltipProviderSettings,
  type TooltipProviderProps,
} from './tooltip-provider';
export type { TooltipProviderProps } from './tooltip-provider';
export type { TooltipOptions, TooltipValue, TooltipProps } from './tooltip-types';

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export function TooltipProvider({ children, ...props }: TooltipProviderProps) {
  const inherited = useTooltipProviderSettings();
  const value = React.useMemo(
    () => ({ provided: true, options: { ...inherited.options, ...props } }),
    [inherited.options, props],
  );
  return (
    <TooltipSettingsContext.Provider value={value}>
      <TooltipPrimitive.Provider {...value.options}>{children}</TooltipPrimitive.Provider>
    </TooltipSettingsContext.Provider>
  );
}
export type TooltipContentProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> &
  Omit<PlainStyleProps, 'tooltip'>;
export const TooltipContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(
  (
    { className, sideOffset = 6, collisionPadding = 8, children, unstyled, style, ...props },
    ref,
  ) => {
    const styles = useStyles();
    return (
      <TooltipPrimitive.Portal container={usePortalContainer()}>
        <TooltipPrimitive.Content
          ref={ref}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          {...styles(
            'tooltip.content',
            'ui-popup z-[var(--ui-layer-dropdown)] max-w-64 break-words rounded-[var(--ui-tooltip-radius,var(--ui-radius))] bg-[var(--ui-tooltip-background,var(--ui-foreground))] px-3 py-2 text-xs leading-5 text-[var(--ui-tooltip-foreground,var(--ui-background))] shadow-popover',
            className,
            unstyled,
          )}
          style={{
            maxWidth:
              'min(16rem, var(--radix-tooltip-content-available-width, calc(100vw - 16px)))',
            ...style,
          }}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow
            {...styles(
              'tooltip.arrow',
              'fill-[var(--ui-tooltip-background,var(--ui-foreground))]',
              undefined,
              unstyled,
            )}
          />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    );
  },
);
TooltipContent.displayName = 'TooltipContent';
