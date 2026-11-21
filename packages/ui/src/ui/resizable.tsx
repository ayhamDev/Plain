import * as React from 'react';
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
import { useLayoutPresence, type LayoutPresenceProps } from './layout-presence';

const ResizableContext = /* @__PURE__ */ React.createContext(0);
export type ResizableProps = Omit<React.ComponentProps<typeof Group>, 'elementRef'> &
  PlainStyleProps & {
    presence?: LayoutPresenceProps['presence'];
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
      presence,
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
    const scope = useLayoutPresence<HTMLDivElement>(children, presence);
    const presenceRef = scope.ref;
    const assignElement = React.useCallback(
      (node: HTMLDivElement | null) => {
        element.current = node;
        presenceRef(node);
      },
      [presenceRef],
    );
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
          {styles.tooltip(
            <Group
              elementRef={assignElement}
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
              {scope.children}
            </Group>,
            unstyled,
          )}
        </ResizableContext.Provider>
      </StyleProvider>
    );
  },
);
Resizable.displayName = 'Resizable';

export type ResizablePanelProps = Omit<React.ComponentProps<typeof Panel>, 'elementRef'> &
  PlainStyleProps & {
    presence?: LayoutPresenceProps['presence'];
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
      presence,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const width = React.useContext(ResizableContext);
    const compact = collapseAt !== undefined && width > 0 && width < collapseAt;
    const scope = useLayoutPresence<HTMLDivElement>(children, compact ? false : presence);
    const panelElement = React.useRef<HTMLDivElement | null>(null);
    React.useImperativeHandle(ref, () => panelElement.current!);
    const presenceRef = scope.ref;
    const assignElement = React.useCallback(
      (node: HTMLDivElement | null) => {
        panelElement.current = node;
        // The panel engine owns the outer flex item and its inner scrolling surface.
        presenceRef(node?.firstElementChild as HTMLDivElement | null);
      },
      [presenceRef],
    );
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
        {styles.tooltip(
          <Panel
            elementRef={assignElement}
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
            {!compact && scope.children}
          </Panel>,
          unstyled,
        )}
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
>(({ className, unstyled, withHandle = false, children, ...props }, ref) => {
  const styles = useStyles();
  const { t } = useTranslation();
  return styles.tooltip(
    <Separator
      elementRef={ref}
      aria-label={t('panel.resizePanels')}
      {...styles('resizable.handle', 'ui-split-pane-handle ui-edge-handle', className, unstyled)}
      {...props}
    >
      {children ??
        (withHandle && (
          <GripVertical
            {...styles('resizable.icon', 'ui-split-pane-icon', undefined, unstyled)}
            aria-hidden="true"
          />
        ))}
    </Separator>,
    unstyled,
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
