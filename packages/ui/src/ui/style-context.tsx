import * as React from 'react';
import { type TooltipProps, type TooltipValue } from './tooltip-types';
import { type StyleSlot } from './slots';
import { StyleContext, PortalContainerContext } from './styling-internal';
import { cn } from './utils';
import { wrapTooltip } from './tooltip-prop';
import { Direction } from 'radix-ui';

export type TextDirection = 'ltr' | 'rtl';

export interface PlainStyleProps extends TooltipProps {
  unstyled?: boolean;
}

/** @deprecated Use the corresponding resizable.* styling slots. */
export type SplitPaneStyleSlot = `split-pane.${'root' | 'panel' | 'handle' | 'icon'}`;

export type ComponentStyles = Partial<Record<StyleSlot | SplitPaneStyleSlot, string>>;
const emptyStyles: ComponentStyles = {};

export function StyleProvider({
  children,
  unstyled,
  styles = emptyStyles,
}: {
  children: React.ReactNode;
  unstyled?: boolean;
  styles?: ComponentStyles;
}) {
  const parent = React.useContext(StyleContext);
  const value = React.useMemo(
    () => ({ unstyled: unstyled ?? parent.unstyled, styles: { ...parent.styles, ...styles } }),
    [unstyled, styles, parent],
  );
  return <StyleContext.Provider value={value}>{children}</StyleContext.Provider>;
}

// One context read per component; the returned function can also style conditional parts.
export function useStyles() {
  const context = React.useContext(StyleContext);
  const styles = (slot: StyleSlot, defaults: string, className?: string, unstyled?: boolean) => {
    const index = slot.indexOf('.');
    const override =
      context.styles[slot] ??
      (slot.startsWith('resizable.')
        ? context.styles[`split-pane.${slot.slice(index + 1)}` as SplitPaneStyleSlot]
        : undefined);
    return {
      'data-ui': slot.slice(0, index),
      'data-slot': slot.slice(index + 1),
      className: cn((unstyled ?? context.unstyled) ? undefined : defaults, override, className),
    };
  };
  return Object.assign(styles, {
    unstyled: context.unstyled,
    tooltip: <P,>(element: React.ReactElement<P>, unstyled?: boolean, value?: TooltipValue) =>
      wrapTooltip(
        element,
        unstyled ?? context.unstyled,
        value,
        styles('tooltip.disabled-trigger', '', undefined, unstyled),
      ),
  });
}

export function DirectionProvider({
  children,
  dir,
}: {
  children: React.ReactNode;
  dir: TextDirection;
}) {
  return <Direction.Provider dir={dir}>{children}</Direction.Provider>;
}

export const useDirection: (localDirection?: TextDirection) => TextDirection =
  Direction.useDirection;

export function usePortalContainer() {
  return React.useContext(PortalContainerContext);
}
