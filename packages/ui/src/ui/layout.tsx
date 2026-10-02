import * as React from 'react';
import { Slot } from 'radix-ui';
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  usePanelCallbackRef,
  type PanelImperativeHandle,
} from 'react-resizable-panels';
import { Sheet, SheetContent, SheetTitle } from './overlays';
import { GripVertical } from 'lucide-react';
import { useTranslation } from './i18n';
import { StyleProvider, useDirection, useStyles, type PlainStyleProps } from './styling';

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

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps {
  asChild?: boolean;
  padding?: ResponsiveValue<LayoutSpace>;
}

export const Box = /* @__PURE__ */ React.forwardRef<HTMLDivElement, BoxProps>(
  ({ asChild, padding, style, className, unstyled, ...props }, ref) => {
    const styles = useStyles();
    const Element = asChild ? Slot.Root : 'div';
    return (
      <Element
        ref={ref}
        {...styles('box.root', 'ui-box', className, unstyled)}
        style={{ ...variables('padding', padding, 0, space), ...style }}
        {...props}
      />
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
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const Element = asChild ? Slot.Root : 'div';
    return (
      <Element
        ref={ref}
        {...styles('flex.root', 'ui-box ui-flex', className, unstyled)}
        style={{ ...flexVariables({ padding, gap, direction, align, justify, wrap }), ...style }}
        {...props}
      />
    );
  },
);
Flex.displayName = 'Flex';

export type StackProps = Omit<FlexProps, 'direction'>;
export const Stack = /* @__PURE__ */ React.forwardRef<HTMLDivElement, StackProps>(
  ({ padding, gap, align, justify, wrap, asChild, className, style, unstyled, ...props }, ref) => {
    const styles = useStyles();
    const Element = asChild ? Slot.Root : 'div';
    return (
      <Element
        ref={ref}
        {...styles('stack.root', 'ui-box ui-flex', className, unstyled)}
        style={{
          ...flexVariables({ padding, gap, align, justify, wrap, direction: 'column' }),
          ...style,
        }}
        {...props}
      />
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
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const Element = asChild ? Slot.Root : 'div';
    return (
      <Element
        ref={ref}
        {...styles('inline.root', 'ui-box ui-flex', className, unstyled)}
        style={{
          ...flexVariables({ padding, gap, align, justify, wrap, direction: 'row' }),
          ...style,
        }}
        {...props}
      />
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
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const Element = asChild ? Slot.Root : 'div';
    return (
      <Element
        ref={ref}
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
      />
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
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const Element = asChild ? Slot.Root : 'div';
    return (
      <Element
        ref={ref}
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
      />
    );
  },
);
Container.displayName = 'Container';

export interface CenterProps extends BoxProps {
  inline?: boolean;
}
export const Center = /* @__PURE__ */ React.forwardRef<HTMLDivElement, CenterProps>(
  ({ inline, padding, asChild, className, style, unstyled, ...props }, ref) => {
    const styles = useStyles();
    const Element = asChild ? Slot.Root : 'div';
    return (
      <Element
        ref={ref}
        {...styles('center.root', 'ui-box ui-center', className, unstyled)}
        data-inline={inline || undefined}
        style={{ ...variables('padding', padding, 0, space), ...style }}
        {...props}
      />
    );
  },
);
Center.displayName = 'Center';

export interface SpacerProps extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps {
  size?: ResponsiveValue<LayoutSpace>;
  axis?: 'horizontal' | 'vertical';
}
export const Spacer = /* @__PURE__ */ React.forwardRef<HTMLDivElement, SpacerProps>(
  ({ size, axis = 'vertical', className, style, unstyled, ...props }, ref) => {
    const styles = useStyles();
    return (
      <div
        ref={ref}
        aria-hidden="true"
        {...styles('spacer.root', 'ui-spacer', className, unstyled)}
        data-axis={axis}
        data-flex={size === undefined || undefined}
        style={{ ...variables('space', size, 0, space), ...style }}
        {...props}
      />
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
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    return (
      <div
        ref={ref}
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
          children,
          (child) =>
            child != null && (
              <div {...styles('masonry.item', 'ui-masonry-item', undefined, unstyled)}>{child}</div>
            ),
        )}
      </div>
    );
  },
);
Masonry.displayName = 'Masonry';

const ResizableContext = React.createContext(0);
export type ResizableProps = Omit<React.ComponentProps<typeof Group>, 'elementRef'> &
  PlainStyleProps & {
    mobileOrientation?: 'horizontal' | 'vertical' | false;
    mobileBreakpoint?: number;
    storageKey?: string;
    storage?: Pick<Storage, 'getItem' | 'setItem'>;
  };
export { useGroupRef, usePanelRef, useDefaultLayout } from 'react-resizable-panels';
export const Resizable = /* @__PURE__ */ React.forwardRef<HTMLDivElement, ResizableProps>(
  (
    {
      className,
      unstyled,
      dir,
      children,
      orientation = 'horizontal',
      mobileOrientation = 'vertical',
      mobileBreakpoint = 520,
      storageKey,
      storage,
      defaultLayout,
      onLayoutChanged,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const direction = useDirection(dir as 'ltr' | 'rtl' | undefined);
    const generatedId = React.useId();
    const persistence = React.useMemo(
      () =>
        storage ?? {
          getItem: (key: string) => {
            try {
              return storageKey && typeof window !== 'undefined'
                ? window.localStorage.getItem(key)
                : null;
            } catch {
              return null;
            }
          },
          setItem: (key: string, value: string) => {
            try {
              if (storageKey && typeof window !== 'undefined')
                window.localStorage.setItem(key, value);
            } catch {
              /* Storage may be unavailable in private browsing. */
            }
          },
        },
      [storage, storageKey],
    );
    const saved = useDefaultLayout({
      id: storageKey ?? generatedId,
      storage: persistence,
      onlySaveAfterUserInteractions: true,
    });
    const element = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => element.current!);
    const [containerWidth, setWidth] = React.useState(0);
    const narrow = containerWidth > 0 && containerWidth < mobileBreakpoint;
    React.useEffect(() => {
      if (!element.current) return;
      const root = element.current;
      const update = () => {
        if (root.clientWidth > 0) setWidth(root.clientWidth);
      };
      update();
      const observer = new ResizeObserver(update);
      observer.observe(root);
      return () => observer.disconnect();
    }, [mobileOrientation, mobileBreakpoint]);
    return (
      <StyleProvider unstyled={unstyled}>
        <ResizableContext.Provider value={containerWidth}>
          <Group
            elementRef={element}
            defaultLayout={saved.defaultLayout ?? defaultLayout}
            onLayoutChanged={(layout, meta) => {
              saved.onLayoutChanged(layout, meta);
              onLayoutChanged?.(layout, meta);
            }}
            orientation={narrow && mobileOrientation ? mobileOrientation : orientation}
            resizeTargetMinimumSize={{ coarse: 32, fine: 12 }}
            dir={direction}
            {...styles('resizable.root', 'ui-split-pane', className, unstyled)}
            {...props}
          >
            {children}
          </Group>
        </ResizableContext.Provider>
      </StyleProvider>
    );
  },
);
Resizable.displayName = 'Resizable';

export type ResizablePanelProps = Omit<React.ComponentProps<typeof Panel>, 'elementRef'> &
  PlainStyleProps & {
    collapseAt?: number;
    adaptTo?: 'hidden' | 'docked' | 'floating';
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    overlayTitle?: string;
    sheetProps?: Partial<
      Pick<
        React.ComponentProps<typeof Sheet>,
        | 'side'
        | 'mobileSide'
        | 'mobileBreakpoint'
        | 'size'
        | 'gap'
        | 'dismissible'
        | 'modal'
        | 'handleOnly'
      >
    >;
    contentProps?: React.ComponentProps<typeof SheetContent>;
  };
export const ResizablePanel = /* @__PURE__ */ React.forwardRef<HTMLDivElement, ResizablePanelProps>(
  (
    {
      className,
      unstyled,
      collapseAt,
      adaptTo = 'hidden',
      open,
      defaultOpen = false,
      onOpenChange,
      overlayTitle,
      sheetProps,
      contentProps,
      panelRef,
      onResize,
      children,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const width = React.useContext(ResizableContext);
    const compact = collapseAt !== undefined && width > 0 && width < collapseAt;
    const [localOpen, setOpen] = React.useState(defaultOpen);
    const overlayOpen = open ?? localOpen;
    const [handle, setHandle] = usePanelCallbackRef();
    const wasCollapsed = React.useRef<boolean | undefined>(undefined);
    const assignHandle = React.useCallback(
      (value: PanelImperativeHandle | null) => {
        setHandle(value);
        if (typeof panelRef === 'function') return panelRef(value);
        if (panelRef) panelRef.current = value;
      },
      [panelRef, setHandle],
    );
    React.useEffect(() => {
      if (!handle || (open === undefined && collapseAt === undefined)) return;
      if (compact || open === false) handle.collapse();
      else handle.expand();
    }, [compact, open, collapseAt, handle]);
    const change = (next: boolean) => {
      if (open === undefined) setOpen(next);
      onOpenChange?.(next);
    };
    return (
      <>
        <Panel
          elementRef={ref}
          {...styles('resizable.panel', 'ui-split-pane-panel', className, unstyled)}
          {...props}
          panelRef={assignHandle}
          collapsible={props.collapsible || collapseAt !== undefined || open !== undefined}
          onResize={(size, id, previous) => {
            onResize?.(size, id, previous);
            const collapsed = handle?.isCollapsed();
            if (collapsed === undefined) return;
            if (
              !compact &&
              open !== undefined &&
              wasCollapsed.current !== undefined &&
              collapsed !== wasCollapsed.current
            )
              onOpenChange?.(!collapsed);
            wasCollapsed.current = collapsed;
          }}
        >
          {!compact && children}
        </Panel>
        {compact && adaptTo !== 'hidden' && (
          <Sheet
            {...sheetProps}
            open={overlayOpen}
            onOpenChange={change}
            variant={adaptTo === 'floating' ? 'floating' : 'attached'}
          >
            <SheetContent {...contentProps} unstyled={unstyled}>
              <SheetTitle>{overlayTitle ?? t('navigation.label')}</SheetTitle>
              {children}
            </SheetContent>
          </Sheet>
        )}
      </>
    );
  },
);
ResizablePanel.displayName = 'ResizablePanel';

export type ResizableHandleProps = Omit<React.ComponentProps<typeof Separator>, 'elementRef'> &
  PlainStyleProps & { withHandle?: boolean };
export const ResizableHandle = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  ResizableHandleProps
>(({ className, unstyled, withHandle = true, children, ...props }, ref) => {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <Separator
      elementRef={ref}
      aria-label={t('panel.resizePanels')}
      {...styles('resizable.handle', 'ui-split-pane-handle', className, unstyled)}
      {...props}
    >
      {children ??
        (withHandle && (
          <GripVertical
            {...styles('resizable.icon', 'ui-split-pane-icon', undefined, unstyled)}
            aria-hidden="true"
          />
        ))}
    </Separator>
  );
});
ResizableHandle.displayName = 'ResizableHandle';
/** @deprecated Use Resizable, ResizablePanel and ResizableHandle. */
export const SplitPane = Resizable;
export const SplitPanePanel = ResizablePanel;
export const SplitPaneHandle = ResizableHandle;
export type SplitPaneProps = ResizableProps;
export type SplitPanePanelProps = ResizablePanelProps;
export type SplitPaneHandleProps = ResizableHandleProps;
