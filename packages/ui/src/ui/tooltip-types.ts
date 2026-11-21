import type * as React from 'react';
import type { Tooltip as TooltipPrimitive } from 'radix-ui';

export interface TooltipOptions extends Omit<
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
  'children' | 'content' | 'asChild'
> {
  [attribute: `data-${string}`]: string | number | boolean | undefined;
  content: React.ReactNode;
  /** An accessible trigger name for rich-content tooltips on otherwise unnamed icon buttons. */
  label?: string;
  disabled?: boolean;
  delayDuration?: number;
  disableHoverableContent?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  unstyled?: boolean;
}
export type TooltipValue = React.ReactNode | TooltipOptions;
export interface TooltipProps {
  tooltip?: TooltipValue;
}
