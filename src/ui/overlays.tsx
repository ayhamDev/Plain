import {
  DirectionProvider,
  useStyles,
  useDirection,
  usePortalContainer,
  type PlainStyleProps,
  type TextDirection,
} from './styling';
import * as React from 'react';
import {
  Dialog as DialogPrimitive,
  AlertDialog as AlertDialogPrimitive,
  Popover as PopoverPrimitive,
  Tooltip as TooltipPrimitive,
  DropdownMenu as DropdownPrimitive,
} from 'radix-ui';
import { Check, ChevronRight, Circle, X } from 'lucide-react';
import { Toaster as Sonner, toast, type ToasterProps as SonnerToasterProps } from 'sonner';
import { Drawer as Vaul } from 'vaul';
import { cn } from './utils';
import { buttonVariants } from './primitives';
import { useModalInert } from './modal-accessibility';
import { useMotionSettings } from './motion-policy';
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export function DialogPortal(props: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  const container = usePortalContainer();
  return <DialogPrimitive.Portal container={container} {...props} />;
}
export const DialogOverlay = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      {...styles(
        'dialog.overlay',
        'ui-overlay fixed inset-0 z-[var(--ui-layer-overlay)] bg-[var(--ui-overlay,#00000066)]',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = 'DialogOverlay';
export const DialogContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  (React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showClose?: boolean;
  }) &
    PlainStyleProps
>(({ className, children, showClose = true, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <DialogPortal>
      <DialogOverlay unstyled={unstyled} />
      <DialogPrimitive.Content
        ref={ref}
        {...styles(
          'dialog.content',
          cn(
            'ui-dialog fixed top-1/2 left-1/2 z-[var(--ui-layer-dialog)] max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-[var(--ui-dialog-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-[var(--ui-dialog-border,var(--ui-border))] bg-[var(--ui-dialog-background,var(--ui-surface))] p-5 text-[var(--ui-dialog-foreground,var(--ui-foreground))] shadow-[var(--ui-dialog-shadow,var(--ui-shadow))] sm:p-6',
            showClose && '[&_[data-slot=header]]:pe-8',
          ),
          className,
          unstyled,
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogClose
            {...styles(
              'dialog.close',
              'ui-interactive absolute top-4 end-4 flex size-8 items-center justify-center rounded-ui text-muted-foreground hover:bg-muted hover:text-foreground',
              undefined,
              unstyled,
            )}
            aria-label="Close dialog"
          >
            <X {...styles('dialog.close-icon', 'size-4', undefined, unstyled)} aria-hidden="true" />
          </DialogClose>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = 'DialogContent';
export function DialogHeader({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'div'> & PlainStyleProps) {
  const styles = useStyles();
  return (
    <div
      {...styles('dialog.header', 'mb-5 flex flex-col gap-1.5 text-start', className, unstyled)}
      {...props}
    />
  );
}
export function DialogFooter({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'div'> & PlainStyleProps) {
  const styles = useStyles();
  return (
    <div
      {...styles(
        'dialog.footer',
        'mt-5 flex flex-wrap items-center justify-end gap-2',
        className,
        unstyled,
      )}
      {...props}
    />
  );
}
export const DialogTitle = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <DialogPrimitive.Title
      ref={ref}
      {...styles('dialog.title', 'text-lg font-semibold leading-7', className, unstyled)}
      {...props}
    />
  );
});
DialogTitle.displayName = 'DialogTitle';
export const DialogDescription = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <DialogPrimitive.Description
      ref={ref}
      {...styles(
        'dialog.description',
        'text-sm leading-6 text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
DialogDescription.displayName = 'DialogDescription';
export type SheetSide = 'start' | 'end' | 'left' | 'right' | 'top' | 'bottom';
export type SheetProps = React.ComponentProps<typeof Vaul.Root> & {
  /** Takes precedence over native direction and the legacy SheetContent side. */
  side?: SheetSide;
  dir?: TextDirection;
};
export type DrawerProps = SheetProps;
type PanelConfiguration = { side?: SheetSide; dir?: TextDirection };
const PanelContext = /* @__PURE__ */ React.createContext<{
  side: 'left' | 'right' | 'top' | 'bottom';
  hasSnapPoints: boolean;
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
  ...props
}: SheetProps & { defaultSide: SheetSide }) {
  const [configuration, configure] = React.useState<PanelConfiguration>({});
  const textDirection = useDirection(dir ?? configuration.dir);
  const logicalSide = side ?? direction ?? configuration.side ?? defaultSide;
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
    () => ({ side: resolvedSide, hasSnapPoints: Boolean(props.snapPoints?.length), configure }),
    [resolvedSide, props.snapPoints?.length],
  );
  return (
    <DirectionProvider dir={textDirection}>
      <PanelContext.Provider value={context}>
        <Vaul.Root direction={resolvedSide} autoFocus={autoFocus} {...props}>
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
export const SheetTrigger = Vaul.Trigger;
export const SheetClose = Vaul.Close;
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
  return (
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
    />
  );
});
SheetOverlay.displayName = 'SheetOverlay';
export const SheetHandle = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof Vaul.Handle>,
  React.ComponentPropsWithoutRef<typeof Vaul.Handle> & PlainStyleProps
>(({ className, unstyled, preventCycle, onKeyDown, ...props }, ref) => {
  const styles = useStyles();
  const context = React.useContext(PanelContext);
  const keyboardInteractive = context?.hasSnapPoints && !preventCycle;
  return (
    <Vaul.Handle
      ref={ref}
      preventCycle={preventCycle}
      role={keyboardInteractive ? 'button' : undefined}
      tabIndex={keyboardInteractive ? 0 : undefined}
      aria-hidden={keyboardInteractive ? false : true}
      aria-label={keyboardInteractive ? 'Resize panel' : undefined}
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
    />
  );
});
SheetHandle.displayName = 'SheetHandle';
export const SheetContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof Vaul.Content>,
  (React.ComponentPropsWithoutRef<typeof Vaul.Content> & {
    side?: SheetSide;
    showClose?: boolean;
  }) &
    PlainStyleProps
>(({ className, children, side, showClose = true, unstyled, dir, ...props }, ref) => {
  const styles = useStyles();
  const motion = useMotionSettings();
  const context = React.useContext(PanelContext);
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
  return (
    <SheetPortal>
      <SheetOverlay unstyled={unstyled} />
      <Vaul.Content
        ref={ref}
        {...styles(
          'sheet.content',
          cn(
            'fixed z-[var(--ui-layer-dialog)] overflow-y-auto overscroll-contain border-[length:var(--ui-border-width,1px)] border-[var(--ui-sheet-border,var(--ui-border))] bg-[var(--ui-sheet-background,var(--ui-surface))] p-5 text-[var(--ui-sheet-foreground,var(--ui-foreground))] shadow-[var(--ui-sheet-shadow,var(--ui-shadow))] outline-none sm:p-6',
            vertical
              ? cn(
                  'ui-drawer inset-x-0',
                  context?.hasSnapPoints ? 'h-dvh max-h-none' : 'max-h-[90dvh]',
                  resolvedSide === 'bottom'
                    ? 'bottom-0 rounded-t-[var(--ui-sheet-radius,var(--ui-radius))] pb-[max(1.5rem,env(safe-area-inset-bottom))]'
                    : 'top-0 rounded-b-[var(--ui-sheet-radius,var(--ui-radius))] pt-[max(1.5rem,env(safe-area-inset-top))]',
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
        data-ui-motion={motion.reduced ? 'reduced' : undefined}
        {...props}
      >
        {children}
        {showClose && (
          <SheetClose
            {...styles(
              'sheet.close',
              'ui-interactive absolute top-4 end-4 flex size-8 items-center justify-center rounded-ui text-muted-foreground hover:bg-muted hover:text-foreground',
              undefined,
              unstyled,
            )}
            aria-label="Close panel"
          >
            <X {...styles('sheet.close-icon', 'size-4', undefined, unstyled)} aria-hidden="true" />
          </SheetClose>
        )}
      </Vaul.Content>
    </SheetPortal>
  );
});
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
export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <AlertDialogPrimitive.Portal container={usePortalContainer()}>
      <AlertDialogPrimitive.Overlay
        {...styles(
          'alert-dialog.overlay',
          'ui-overlay fixed inset-0 z-[var(--ui-layer-overlay)] bg-[var(--ui-overlay,#00000066)]',
          undefined,
          unstyled,
        )}
      />
      <AlertDialogPrimitive.Content
        ref={ref}
        {...styles(
          'alert-dialog.content',
          'ui-dialog fixed top-1/2 left-1/2 z-[var(--ui-layer-dialog)] max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-[var(--ui-dialog-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-[var(--ui-dialog-border,var(--ui-border))] bg-[var(--ui-dialog-background,var(--ui-surface))] p-5 text-[var(--ui-dialog-foreground,var(--ui-foreground))] shadow-[var(--ui-dialog-shadow,var(--ui-shadow))] sm:p-6',
          className,
          unstyled,
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  );
});
AlertDialogContent.displayName = 'AlertDialogContent';
export const AlertDialogTitle = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      {...styles('alert-dialog.title', 'mb-2 text-lg font-semibold', className, unstyled)}
      {...props}
    />
  );
});
AlertDialogTitle.displayName = 'AlertDialogTitle';
export const AlertDialogDescription = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      {...styles(
        'alert-dialog.description',
        'text-sm leading-6 text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
AlertDialogDescription.displayName = 'AlertDialogDescription';
export const AlertDialogAction = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <AlertDialogPrimitive.Action
      ref={ref}
      {...styles('alert-dialog.action', buttonVariants(), className, unstyled)}
      {...props}
    />
  );
});
AlertDialogAction.displayName = 'AlertDialogAction';
export const AlertDialogCancel = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <AlertDialogPrimitive.Cancel
      ref={ref}
      {...styles(
        'alert-dialog.cancel',
        buttonVariants({ variant: 'outline' }),
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
AlertDialogCancel.displayName = 'AlertDialogCancel';
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;
export const PopoverContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & PlainStyleProps
>(({ className, align = 'center', sideOffset = 8, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <PopoverPrimitive.Portal container={usePortalContainer()}>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        {...styles(
          'popover.content',
          'ui-popup z-[var(--ui-layer-dropdown)] max-w-[calc(100vw-32px)] rounded-[var(--ui-popover-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-[var(--ui-popover-border,var(--ui-border))] bg-[var(--ui-popover-background,var(--ui-surface))] p-4 text-[var(--ui-popover-foreground,var(--ui-foreground))] shadow-[var(--ui-popover-shadow,var(--ui-shadow))] outline-none',
          className,
          unstyled,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = 'PopoverContent';
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export const TooltipContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & PlainStyleProps
>(({ className, sideOffset = 6, children, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <TooltipPrimitive.Portal container={usePortalContainer()}>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        {...styles(
          'tooltip.content',
          'ui-popup z-[var(--ui-layer-dropdown)] max-w-64 rounded-[var(--ui-tooltip-radius,var(--ui-radius))] bg-[var(--ui-tooltip-background,var(--ui-foreground))] px-3 py-2 text-xs leading-5 text-[var(--ui-tooltip-foreground,var(--ui-background))] shadow-popover',
          className,
          unstyled,
        )}
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
});
TooltipContent.displayName = 'TooltipContent';
export function DropdownMenu({
  modal = false,
  open,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Root>) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  useModalInert(isOpen && modal);
  return (
    <DropdownPrimitive.Root
      modal={modal}
      open={isOpen}
      onOpenChange={(next) => {
        if (open === undefined) setInternalOpen(next);
        onOpenChange?.(next);
      }}
      {...props}
    />
  );
}
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;
export const DropdownMenuSub = DropdownPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownPrimitive.RadioGroup;
const menuContent =
  'ui-popup z-[var(--ui-layer-dropdown)] min-w-44 max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto rounded-[var(--ui-popover-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-[var(--ui-popover-border,var(--ui-border))] bg-[var(--ui-popover-background,var(--ui-surface))] p-1 text-[var(--ui-popover-foreground,var(--ui-foreground))] shadow-[var(--ui-popover-shadow,var(--ui-shadow))]';
const menuItem =
  'ui-interactive relative flex min-h-9 cursor-default select-none items-center gap-2 rounded-[min(var(--ui-radius),4px)] px-3 py-2 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-45 [&_svg]:size-4 [&_svg]:text-muted-foreground';
export const DropdownMenuContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content> & PlainStyleProps
>(({ className, sideOffset = 6, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <DropdownPrimitive.Portal container={usePortalContainer()}>
      <DropdownPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        {...styles('dropdown-menu.content', menuContent, className, unstyled)}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';
export const DropdownMenuItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Item>,
  (React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & {
    destructive?: boolean;
  }) &
    PlainStyleProps
>(({ className, destructive, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <DropdownPrimitive.Item
      ref={ref}
      {...styles(
        'dropdown-menu.item',
        cn(
          menuItem,
          destructive && 'text-danger data-[highlighted]:bg-danger-soft [&_svg]:text-danger',
        ),
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';
export const DropdownMenuCheckboxItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.CheckboxItem> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <DropdownPrimitive.CheckboxItem
      ref={ref}
      {...styles('dropdown-menu.checkbox-item', cn(menuItem, 'ps-8'), className, unstyled)}
      {...props}
    >
      <span {...styles('dropdown-menu.item-indicator', 'absolute start-2', undefined, unstyled)}>
        <DropdownPrimitive.ItemIndicator>
          <Check
            {...styles('dropdown-menu.check-icon', 'size-4', undefined, unstyled)}
            aria-hidden="true"
          />
        </DropdownPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownPrimitive.CheckboxItem>
  );
});
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';
export const DropdownMenuRadioItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.RadioItem> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <DropdownPrimitive.RadioItem
      ref={ref}
      {...styles('dropdown-menu.radio-item', cn(menuItem, 'ps-8'), className, unstyled)}
      {...props}
    >
      <span {...styles('dropdown-menu.item-indicator', 'absolute start-2', undefined, unstyled)}>
        <DropdownPrimitive.ItemIndicator>
          <Circle
            {...styles('dropdown-menu.radio-icon', 'size-2 fill-current', undefined, unstyled)}
            aria-hidden="true"
          />
        </DropdownPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownPrimitive.RadioItem>
  );
});
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';
export const DropdownMenuLabel = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Label> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <DropdownPrimitive.Label
      ref={ref}
      {...styles(
        'dropdown-menu.label',
        'px-3 py-2 text-xs font-medium text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />
  );
});
DropdownMenuLabel.displayName = 'DropdownMenuLabel';
export const DropdownMenuSeparator = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <DropdownPrimitive.Separator
      ref={ref}
      {...styles('dropdown-menu.separator', 'my-1 h-px bg-border', className, unstyled)}
      {...props}
    />
  );
});
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';
export const DropdownMenuSubTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.SubTrigger> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <DropdownPrimitive.SubTrigger
      ref={ref}
      {...styles('dropdown-menu.sub-trigger', menuItem, className, unstyled)}
      {...props}
    >
      {children}
      <ChevronRight
        {...styles('dropdown-menu.submenu-icon', 'ms-auto rtl:rotate-180', undefined, unstyled)}
        aria-hidden="true"
      />
    </DropdownPrimitive.SubTrigger>
  );
});
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';
export const DropdownMenuSubContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.SubContent> & PlainStyleProps
>(({ className, unstyled, avoidCollisions = true, ...props }, ref) => {
  const styles = useStyles();
  return (
    <DropdownPrimitive.Portal container={usePortalContainer()}>
      <DropdownPrimitive.SubContent
        ref={ref}
        collisionPadding={8}
        avoidCollisions={avoidCollisions}
        data-collision-aware={avoidCollisions || undefined}
        {...styles('dropdown-menu.content', cn(menuContent, 'ui-submenu'), className, unstyled)}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
});
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';
export function DropdownMenuShortcut({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'span'> & PlainStyleProps) {
  const styles = useStyles();
  return (
    <span
      {...styles(
        'dropdown-menu.shortcut',
        'ms-auto text-xs text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />
  );
}
export type ToasterProps = SonnerToasterProps & PlainStyleProps;
export function Toaster({
  toastOptions,
  unstyled,
  dir: localDirection,
  invert = true,
  style,
  ...props
}: ToasterProps) {
  const styles = useStyles();
  const dir = useDirection(localDirection === 'auto' ? undefined : localDirection);
  const isUnstyled = unstyled ?? styles.unstyled;
  const toastUnstyled = toastOptions?.unstyled ?? isUnstyled;
  const background = invert
    ? 'var(--ui-toast-background,var(--ui-foreground))'
    : 'var(--ui-surface)';
  const foreground = invert
    ? 'var(--ui-toast-foreground,var(--ui-background))'
    : 'var(--ui-foreground)';
  return (
    <Sonner
      dir={dir}
      invert={invert}
      position={dir === 'rtl' ? 'bottom-left' : 'bottom-right'}
      closeButton={false}
      gap={8}
      style={{ zIndex: 'var(--ui-layer-toast)', ...style }}
      toastOptions={{
        unstyled: isUnstyled,
        ...toastOptions,
        className: styles('toast.root', 'ui-toast', toastOptions?.className, toastUnstyled)
          .className,
        style: toastUnstyled
          ? toastOptions?.style
          : ({
              '--normal-bg': background,
              '--normal-text': foreground,
              '--normal-border': 'var(--ui-toast-border,var(--ui-border))',
              background,
              color: foreground,
              border: 'var(--ui-border-width,1px) solid var(--ui-toast-border,var(--ui-border))',
              borderRadius: 'var(--ui-toast-radius,var(--ui-radius))',
              boxShadow: 'var(--ui-toast-shadow,var(--ui-shadow))',
              fontFamily: 'var(--ui-font)',
              ...toastOptions?.style,
            } as React.CSSProperties),
      }}
      {...props}
    />
  );
}
export { toast };
