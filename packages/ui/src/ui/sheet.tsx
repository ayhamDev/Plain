import * as React from 'react';
import { useMediaQuery } from './media-query';
import { Drawer as Vaul } from 'vaul';
import {
  type TextDirection,
  useDirection,
  DirectionProvider,
  type PlainStyleProps,
  useStyles,
  usePortalContainer,
} from './style-context';
import { DialogTitle, DialogDescription, DialogHeader, DialogFooter } from './dialog';
import { useMotionSettings } from './motion-policy';
import { useTranslation } from './i18n';
import { usePanelTouchGestures, PanelDragSurface } from './panel-gestures';
import { usePanelViewport } from './panel-viewport';
import { Slot } from 'radix-ui';
import { cn } from './utils';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { PanelOverflowFill } from './panel-overflow';

export type SheetSide = 'start' | 'end' | 'left' | 'right' | 'top' | 'bottom';

export type SheetProps = React.ComponentProps<typeof Vaul.Root> & {
  /** Takes precedence over native direction and the legacy SheetContent side. */
  side?: SheetSide;
  dir?: TextDirection;
  variant?: 'attached' | 'detached' | 'floating';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  gap?: number;
  mobileSide?: SheetSide;
  mobileBreakpoint?: number;
  /** Maximum panel width. Numbers are pixels; bottom/top panels remain centered. */
  maxWidth?: React.CSSProperties['maxWidth'];
};

export type DrawerProps = SheetProps;

type PanelConfiguration = { side?: SheetSide; dir?: TextDirection };

const PanelContext = /* @__PURE__ */ React.createContext<{
  side: 'left' | 'right' | 'top' | 'bottom';
  hasSnapPoints: boolean;
  snapPoints?: readonly (number | string)[];
  variant: 'attached' | 'detached' | 'floating';
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  gap: number;
  maxWidth?: React.CSSProperties['maxWidth'];
  handleOnly: boolean;
  configure: React.Dispatch<React.SetStateAction<PanelConfiguration>>;
} | null>(null);

const usePanelLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

function PanelRoot({
  side,
  dir,
  direction,
  children,
  autoFocus = true,
  defaultSide,
  variant = 'attached',
  size = 'md',
  gap = 12,
  mobileSide,
  mobileBreakpoint = 640,
  maxWidth,
  handleOnly = false,
  ...props
}: SheetProps & { defaultSide: SheetSide }) {
  const [configuration, configure] = React.useState<PanelConfiguration>({});
  const textDirection = useDirection(dir ?? configuration.dir);
  const mobile = useMediaQuery(`(max-width: ${mobileBreakpoint}px)`, !!mobileSide);
  const logicalSide =
    (mobile && mobileSide ? mobileSide : side) ?? direction ?? configuration.side ?? defaultSide;
  const resolvedSide =
    logicalSide === 'start'
      ? textDirection === 'rtl'
        ? 'right'
        : 'left'
      : logicalSide === 'end'
        ? textDirection === 'rtl'
          ? 'left'
          : 'right'
        : logicalSide;
  const context = React.useMemo(
    () => ({
      side: resolvedSide,
      hasSnapPoints: Boolean(props.snapPoints?.length),
      snapPoints: props.snapPoints,
      configure,
      variant,
      size,
      gap,
      maxWidth,
      handleOnly,
    }),
    [resolvedSide, props.snapPoints, variant, size, gap, maxWidth, handleOnly],
  );
  return (
    <DirectionProvider dir={textDirection}>
      <PanelContext.Provider value={context}>
        <Vaul.Root
          direction={resolvedSide}
          autoFocus={autoFocus}
          handleOnly={handleOnly}
          {...props}
        >
          {children}
        </Vaul.Root>
      </PanelContext.Provider>
    </DirectionProvider>
  );
}

export function Sheet(props: SheetProps) {
  return <PanelRoot defaultSide="end" {...props} />;
}

export function Drawer(props: DrawerProps) {
  return <PanelRoot defaultSide="bottom" {...props} />;
}

export const SheetTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof Vaul.Trigger>,
  React.ComponentPropsWithoutRef<typeof Vaul.Trigger> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<Vaul.Trigger {...props} ref={ref} />, unstyled);
});

SheetTrigger.displayName = 'SheetTrigger';

export const SheetClose = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof Vaul.Close>,
  React.ComponentPropsWithoutRef<typeof Vaul.Close> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<Vaul.Close {...props} ref={ref} />, unstyled);
});

SheetClose.displayName = 'SheetClose';

export const SheetTitle = DialogTitle;

export const SheetDescription = DialogDescription;

export const SheetHeader = DialogHeader;

export const SheetFooter = DialogFooter;

export function SheetPortal(props: React.ComponentProps<typeof Vaul.Portal>) {
  const container = usePortalContainer();
  return <Vaul.Portal container={container} {...props} />;
}

export const SheetOverlay = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof Vaul.Overlay>,
  React.ComponentPropsWithoutRef<typeof Vaul.Overlay> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  const motion = useMotionSettings();
  return styles.tooltip(
    <Vaul.Overlay
      ref={ref}
      data-ui-motion={motion.reduced ? 'reduced' : undefined}
      {...styles(
        'sheet.overlay',
        'fixed inset-0 z-[var(--ui-layer-overlay)] bg-[var(--ui-overlay,#00000066)]',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});

SheetOverlay.displayName = 'SheetOverlay';

export const SheetHandle = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof Vaul.Handle>,
  React.ComponentPropsWithoutRef<typeof Vaul.Handle> & PlainStyleProps
>(({ className, unstyled, preventCycle, onKeyDown, ...props }, ref) => {
  const styles = useStyles();
  const context = React.useContext(PanelContext);
  const { t } = useTranslation();
  const keyboardInteractive = context?.hasSnapPoints && !preventCycle;
  return styles.tooltip(
    <Vaul.Handle
      ref={ref}
      preventCycle={preventCycle}
      role={keyboardInteractive ? 'button' : undefined}
      tabIndex={keyboardInteractive ? 0 : undefined}
      aria-hidden={keyboardInteractive ? false : true}
      aria-label={keyboardInteractive ? t('panel.resize') : undefined}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          !event.defaultPrevented &&
          keyboardInteractive &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
      {...styles('sheet.handle', 'ui-panel-handle mb-5 shrink-0', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

SheetHandle.displayName = 'SheetHandle';

export const SheetContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof Vaul.Content>,
  (React.ComponentPropsWithoutRef<typeof Vaul.Content> & {
    side?: SheetSide;
    showClose?: boolean;
    overlay?: boolean;
    overlayProps?: React.ComponentProps<typeof SheetOverlay>;
    maxWidth?: React.CSSProperties['maxWidth'];
    showHandle?: boolean;
  }) &
    PlainStyleProps
>(
  (
    {
      className,
      children,
      side,
      showClose = true,
      overlay = true,
      overlayProps,
      maxWidth,
      showHandle,
      unstyled,
      dir,
      style,
      asChild,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const motion = useMotionSettings();
    const context = React.useContext(PanelContext);
    const [panel, setPanel] = React.useState<HTMLElement | null>(null);
    const touchGesture = usePanelTouchGestures(panel, context?.handleOnly ?? false);
    const { t } = useTranslation();
    const localDirection = dir === 'ltr' || dir === 'rtl' ? dir : undefined;
    const textDirection = useDirection(localDirection);
    const configure = context?.configure;
    // The wrapper stays mounted while its portal is closed, so Vaul knows the legacy content side before opening.
    usePanelLayoutEffect(() => {
      configure?.({ side, dir: localDirection });
      return () => configure?.({});
    }, [configure, side, localDirection]);
    const resolvedSide = context?.side ?? 'right';
    const vertical = resolvedSide === 'top' || resolvedSide === 'bottom';
    const styled = !(unstyled ?? styles.unstyled);
    const full = styled && context?.size === 'full';
    const widthLimit = maxWidth ?? context?.maxWidth;
    const widthValue = typeof widthLimit === 'number' ? `${widthLimit}px` : widthLimit;
    const interpolatedWidth =
      widthValue && !['none', 'max-content', 'min-content', 'fit-content'].includes(widthValue);
    usePanelViewport(panel, resolvedSide, styled, context?.snapPoints);
    return (
      <>
        <SheetPortal>
          {overlay && <SheetOverlay unstyled={unstyled} {...overlayProps} />}
          <Slot.Root ref={setPanel}>
            {styles.tooltip(
              <Vaul.Content
                ref={ref}
                asChild
                {...styles(
                  'sheet.content',
                  cn(
                    'ui-panel fixed z-[var(--ui-layer-dialog)] min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain border-[length:var(--ui-border-width,1px)] border-[var(--ui-sheet-border,var(--ui-border))] bg-[var(--ui-sheet-background,var(--ui-surface))] p-5 text-[var(--ui-sheet-foreground,var(--ui-foreground))] shadow-[var(--ui-sheet-shadow,var(--ui-shadow))] outline-none sm:p-6',
                    vertical
                      ? cn(
                          'ui-drawer inset-x-0',
                          context?.hasSnapPoints ? 'h-dvh max-h-none' : 'max-h-dvh',
                          resolvedSide === 'bottom'
                            ? 'bottom-0 rounded-t-[calc(var(--ui-sheet-radius,var(--ui-radius))*var(--ui-panel-radius-scale,1))] pb-[max(1.5rem,env(safe-area-inset-bottom))]'
                            : 'top-0 rounded-b-[calc(var(--ui-sheet-radius,var(--ui-radius))*var(--ui-panel-radius-scale,1))] pt-[max(1.5rem,env(safe-area-inset-top))]',
                        )
                      : cn(
                          'ui-sheet inset-y-0 h-dvh',
                          context?.hasSnapPoints ? 'w-screen' : 'w-[min(400px,calc(100%-24px))]',
                          resolvedSide === 'left' ? 'left-0' : 'right-0',
                        ),
                    showClose && '[&_[data-slot=header]]:pe-8',
                  ),
                  className,
                  unstyled,
                )}
                dir={textDirection}
                data-side={resolvedSide}
                data-variant={context?.variant ?? 'attached'}
                data-size={context?.size ?? 'md'}
                data-viewport-expandable={context?.snapPoints?.includes(1) || undefined}
                style={
                  {
                    '--ui-panel-gap': `${context?.gap ?? 12}px`,
                    ...(widthLimit != null && !full
                      ? {
                          maxWidth:
                            styled && vertical && context?.hasSnapPoints && interpolatedWidth
                              ? `calc(min(100vw, ${widthValue}) * var(--ui-panel-layout-scale, 1) + 100vw * (1 - var(--ui-panel-layout-scale, 1)))`
                              : styled && !vertical && context?.hasSnapPoints
                                ? `var(--ui-panel-axis-max-width, ${widthValue})`
                                : widthLimit,
                        }
                      : {}),
                    ...style,
                  } as React.CSSProperties
                }
                data-ui-motion={motion.reduced ? 'reduced' : undefined}
                {...props}
              >
                <PanelDragSurface
                  asChild={asChild}
                  touchGesture={touchGesture}
                  consumerHandlers={{ onPointerDown, onPointerMove, onPointerUp, onPointerCancel }}
                >
                  {(showHandle ?? vertical) &&
                    !React.Children.toArray(children).some(
                      (child) => React.isValidElement(child) && child.type === SheetHandle,
                    ) && <SheetHandle />}
                  {children}
                  {showClose && (
                    <SheetClose
                      {...styles(
                        'sheet.close',
                        'ui-interactive absolute top-4 end-4 flex size-8 items-center justify-center rounded-ui text-muted-foreground hover:bg-muted hover:text-foreground',
                        undefined,
                        unstyled,
                      )}
                      aria-label={t('panel.close')}
                    >
                      <X
                        {...styles('sheet.close-icon', 'size-4', undefined, unstyled)}
                        aria-hidden="true"
                      />
                    </SheetClose>
                  )}
                </PanelDragSurface>
              </Vaul.Content>,
              unstyled,
            )}
          </Slot.Root>
        </SheetPortal>
        {panel?.parentElement &&
        !(unstyled ?? styles.unstyled) &&
        ((context?.variant ?? 'attached') === 'attached' || full || context?.hasSnapPoints)
          ? createPortal(
              <PanelOverflowFill panel={panel} side={resolvedSide} />,
              panel.parentElement,
            )
          : null}
      </>
    );
  },
);

SheetContent.displayName = 'SheetContent';

export const DrawerTrigger = SheetTrigger;

export const DrawerClose = SheetClose;

export const DrawerTitle = SheetTitle;

export const DrawerDescription = SheetDescription;

export const DrawerHeader = SheetHeader;

export const DrawerFooter = SheetFooter;

export const DrawerPortal = SheetPortal;

export const DrawerOverlay = SheetOverlay;

export const DrawerHandle = SheetHandle;

export const DrawerContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof Vaul.Content>,
  Omit<React.ComponentPropsWithoutRef<typeof SheetContent>, 'side'>
>((props, ref) => <SheetContent ref={ref} {...props} />);

DrawerContent.displayName = 'DrawerContent';
