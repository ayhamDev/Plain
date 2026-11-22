import * as React from 'react';
import { Slot } from 'radix-ui';
import { useStyles, type PlainStyleProps } from './style-context';
import { useLayoutPresence, type LayoutPresenceProps } from './layout-presence';
export {
  LayoutPresence,
  type LayoutPresenceOptions,
  type LayoutPresenceProps,
  type LayoutPresenceContainerProps,
} from './layout-presence';

export type LayoutBreakpoint = 'base' | 'sm' | 'md' | 'lg';
export type ResponsiveValue<T> = T | Partial<Record<LayoutBreakpoint, T>>;
/** Numeric spacing is measured in 8px units; strings accept CSS lengths and tokens. */
export type LayoutSpace = number | string;
export type LayoutAlignment = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type LayoutJustification = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

function space(value: LayoutSpace) {
  return typeof value === 'number'
    ? `${Math.max(0, Number.isFinite(value) ? value : 0) * 8}px`
    : value;
}

function variables<T extends string | number>(
  name: string,
  value: ResponsiveValue<T> | undefined,
  fallback: T,
  format: (value: T) => string,
): React.CSSProperties {
  const values = typeof value === 'object' && value !== null ? value : { base: value };
  let current = fallback;
  return Object.fromEntries(
    (['base', 'sm', 'md', 'lg'] as const).map((breakpoint) => {
      current = values[breakpoint] ?? current;
      return [`--ui-layout-${name}-${breakpoint}`, format(current)];
    }),
  );
}

function alignment(value: LayoutAlignment) {
  return value === 'start' || value === 'end' ? `flex-${value}` : value;
}

function justification(value: LayoutJustification) {
  return value === 'between' || value === 'around' || value === 'evenly'
    ? `space-${value}`
    : value === 'start' || value === 'end'
      ? `flex-${value}`
      : value;
}

export interface BoxProps
  extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps, LayoutPresenceProps {
  asChild?: boolean;
  padding?: ResponsiveValue<LayoutSpace>;
}

export const Box = /* @__PURE__ */ React.forwardRef<HTMLDivElement, BoxProps>(
  ({ asChild, padding, style, className, unstyled, presence, children, ...props }, ref) => {
    const styles = useStyles();
    const scope = useLayoutPresence(children, presence, ref, asChild);
    const Element = asChild ? Slot.Root : 'div';
    return styles.tooltip(
      <Element
        ref={scope.ref}
        children={scope.children}
        {...styles('box.root', 'ui-box', className, unstyled)}
        style={{ ...variables('padding', padding, 0, space), ...style }}
        {...props}
      />,
      unstyled,
    );
  },
);
Box.displayName = 'Box';

export interface FlexProps extends BoxProps {
  gap?: ResponsiveValue<LayoutSpace>;
  direction?: ResponsiveValue<'row' | 'column' | 'row-reverse' | 'column-reverse'>;
  align?: ResponsiveValue<LayoutAlignment>;
  justify?: ResponsiveValue<LayoutJustification>;
  wrap?: boolean;
}

function flexVariables({ padding, gap, direction, align, justify, wrap }: FlexProps) {
  return {
    ...variables('padding', padding, 0, space),
    ...variables('gap', gap, 1, space),
    ...variables('direction', direction, 'row', String),
    ...variables('align', align, 'stretch', alignment),
    ...variables('justify', justify, 'start', justification),
    '--ui-layout-wrap': wrap ? 'wrap' : 'nowrap',
  } as React.CSSProperties;
}

export const Flex = /* @__PURE__ */ React.forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      padding,
      gap,
      direction,
      align,
      justify,
      wrap,
      asChild,
      className,
      style,
      unstyled,
      presence,
      children,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const scope = useLayoutPresence(children, presence, ref, asChild);
    const Element = asChild ? Slot.Root : 'div';
    return styles.tooltip(
      <Element
        ref={scope.ref}
        children={scope.children}
        {...styles('flex.root', 'ui-box ui-flex', className, unstyled)}
        style={{ ...flexVariables({ padding, gap, direction, align, justify, wrap }), ...style }}
        {...props}
      />,
      unstyled,
    );
  },
);
Flex.displayName = 'Flex';

export type StackProps = Omit<FlexProps, 'direction'>;
export const Stack = /* @__PURE__ */ React.forwardRef<HTMLDivElement, StackProps>(
  (
    {
      padding,
      gap,
      align,
      justify,
      wrap,
      asChild,
      className,
      style,
      unstyled,
      presence,
      children,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const scope = useLayoutPresence(children, presence, ref, asChild);
    const Element = asChild ? Slot.Root : 'div';
    return styles.tooltip(
      <Element
        ref={scope.ref}
        children={scope.children}
        {...styles('stack.root', 'ui-box ui-flex', className, unstyled)}
        style={{
          ...flexVariables({ padding, gap, align, justify, wrap, direction: 'column' }),
          ...style,
        }}
        {...props}
      />,
      unstyled,
    );
  },
);
Stack.displayName = 'Stack';

export type InlineProps = Omit<FlexProps, 'direction'>;
export const Inline = /* @__PURE__ */ React.forwardRef<HTMLDivElement, InlineProps>(
  (
    {
      padding,
      gap,
      align = 'center',
      justify,
      wrap = true,
      asChild,
      className,
      style,
      unstyled,
      presence,
      children,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const scope = useLayoutPresence(children, presence, ref, asChild);
    const Element = asChild ? Slot.Root : 'div';
    return styles.tooltip(
      <Element
        ref={scope.ref}
        children={scope.children}
        {...styles('inline.root', 'ui-box ui-flex', className, unstyled)}
        style={{
          ...flexVariables({ padding, gap, align, justify, wrap, direction: 'row' }),
          ...style,
        }}
        {...props}
      />,
      unstyled,
    );
  },
);
Inline.displayName = 'Inline';

export interface GridProps extends BoxProps {
  columns?: ResponsiveValue<number | string>;
  gap?: ResponsiveValue<LayoutSpace>;
  rowGap?: ResponsiveValue<LayoutSpace>;
  align?: ResponsiveValue<LayoutAlignment>;
  minItemWidth?: string;
}

function gridColumns(value: number | string) {
  return typeof value === 'number'
    ? `repeat(${Math.max(1, Math.floor(Number.isFinite(value) ? value : 1))}, minmax(0, 1fr))`
    : value;
}

export const Grid = /* @__PURE__ */ React.forwardRef<HTMLDivElement, GridProps>(
  (
    {
      columns,
      gap,
      rowGap,
      padding,
      align,
      minItemWidth,
      asChild,
      className,
      style,
      unstyled,
      presence,
      children,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const scope = useLayoutPresence(children, presence, ref, asChild);
    const Element = asChild ? Slot.Root : 'div';
    return styles.tooltip(
      <Element
        ref={scope.ref}
        children={scope.children}
        {...styles('grid.root', 'ui-box ui-grid', className, unstyled)}
        style={{
          ...variables('padding', padding, 0, space),
          ...variables('gap', gap, 2, space),
          ...variables('row-gap', rowGap ?? gap, 2, space),
          ...variables('align', align, 'stretch', alignment),
          ...variables(
            'columns',
            columns ??
              (minItemWidth ? `repeat(auto-fit, minmax(min(100%, ${minItemWidth}), 1fr))` : 1),
            1,
            gridColumns,
          ),
          ...style,
        }}
        {...props}
      />,
      unstyled,
    );
  },
);
Grid.displayName = 'Grid';

export interface ContainerProps extends BoxProps {
  maxWidth?: number | string;
  gutter?: ResponsiveValue<LayoutSpace>;
}
export const Container = /* @__PURE__ */ React.forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      maxWidth = '72rem',
      gutter = { base: 2, md: 3 },
      padding,
      asChild,
      className,
      style,
      unstyled,
      presence,
      children,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const scope = useLayoutPresence(children, presence, ref, asChild);
    const Element = asChild ? Slot.Root : 'div';
    return styles.tooltip(
      <Element
        ref={scope.ref}
        children={scope.children}
        {...styles('container.root', 'ui-box ui-container', className, unstyled)}
        style={
          {
            ...variables('padding', padding, 0, space),
            ...variables('gutter', gutter, 2, space),
            '--ui-container-max-width': typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
            ...style,
          } as React.CSSProperties
        }
        {...props}
      />,
      unstyled,
    );
  },
);
Container.displayName = 'Container';

export interface CenterProps extends BoxProps {
  inline?: boolean;
}
export const Center = /* @__PURE__ */ React.forwardRef<HTMLDivElement, CenterProps>(
  ({ inline, padding, asChild, className, style, unstyled, presence, children, ...props }, ref) => {
    const styles = useStyles();
    const scope = useLayoutPresence(children, presence, ref, asChild);
    const Element = asChild ? Slot.Root : 'div';
    return styles.tooltip(
      <Element
        ref={scope.ref}
        children={scope.children}
        {...styles('center.root', 'ui-box ui-center', className, unstyled)}
        data-inline={inline || undefined}
        style={{ ...variables('padding', padding, 0, space), ...style }}
        {...props}
      />,
      unstyled,
    );
  },
);
Center.displayName = 'Center';

export interface SpacerProps
  extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps, LayoutPresenceProps {
  size?: ResponsiveValue<LayoutSpace>;
  axis?: 'horizontal' | 'vertical';
}
export const Spacer = /* @__PURE__ */ React.forwardRef<HTMLDivElement, SpacerProps>(
  ({ size, axis = 'vertical', className, style, unstyled, presence, children, ...props }, ref) => {
    const styles = useStyles();
    const scope = useLayoutPresence(children, presence, ref);
    return styles.tooltip(
      <div
        ref={scope.ref}
        children={scope.children}
        aria-hidden="true"
        {...styles('spacer.root', 'ui-spacer', className, unstyled)}
        data-axis={axis}
        data-flex={size === undefined || undefined}
        style={{ ...variables('space', size, 0, space), ...style }}
        {...props}
      />,
      unstyled,
    );
  },
);
Spacer.displayName = 'Spacer';

export interface MasonryProps extends Omit<BoxProps, 'asChild'> {
  columns?: ResponsiveValue<number>;
  gap?: ResponsiveValue<LayoutSpace>;
}
export const Masonry = /* @__PURE__ */ React.forwardRef<HTMLDivElement, MasonryProps>(
  (
    {
      columns = { base: 1, sm: 2, lg: 3 },
      gap = 2,
      padding,
      children,
      className,
      style,
      unstyled,
      presence,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const scope = useLayoutPresence(children, presence, ref);
    return styles.tooltip(
      <div
        ref={scope.ref}
        {...styles('masonry.root', 'ui-box ui-masonry', className, unstyled)}
        style={{
          ...variables('padding', padding, 0, space),
          ...variables('gap', gap, 2, space),
          ...variables('lanes', columns, 1, (n) =>
            String(Math.max(1, Math.floor(Number.isFinite(n) ? n : 1))),
          ),
          ...style,
        }}
        {...props}
      >
        {React.Children.map(
          scope.children,
          (child) =>
            child != null && (
              <div {...styles('masonry.item', 'ui-masonry-item', undefined, unstyled)}>{child}</div>
            ),
        )}
      </div>,
      unstyled,
    );
  },
);
Masonry.displayName = 'Masonry';

export * from './resizable';
