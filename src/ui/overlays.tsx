import { useStyles, useDirection, usePortalContainer, type PlainStyleProps } from './styling';
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
import { cn } from './utils';
import { buttonVariants } from './primitives';
import { useModalInert } from './modal-accessibility';
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
        'ui-overlay fixed inset-0 z-50 bg-black/40',
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
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        {...styles(
          'dialog.content',
          'ui-dialog fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100%-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-ui border bg-surface p-6 text-foreground shadow-popover',
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
              'absolute top-4 end-4 flex size-7 items-center justify-center rounded-ui text-muted-foreground hover:bg-muted hover:text-foreground',
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
      {...styles('dialog.header', 'mb-6 flex flex-col gap-2 pe-7', className, unstyled)}
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
        'mt-6 flex flex-wrap items-center justify-end gap-2',
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
export const Sheet = Dialog;
export const SheetTrigger = DialogTrigger;
export const SheetClose = DialogClose;
export const SheetTitle = DialogTitle;
export const SheetDescription = DialogDescription;
export const SheetHeader = DialogHeader;
export const SheetFooter = DialogFooter;
export const SheetContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  (React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: 'start' | 'end' | 'left' | 'right' | 'bottom';
    showClose?: boolean;
  }) &
    PlainStyleProps
>(({ className, children, side = 'end', showClose = true, unstyled, ...props }, ref) => {
  const styles = useStyles();
  const direction = useDirection(props.dir as 'ltr' | 'rtl' | undefined);
  side =
    side === 'start'
      ? direction === 'rtl'
        ? 'right'
        : 'left'
      : side === 'end'
        ? direction === 'rtl'
          ? 'left'
          : 'right'
        : side;
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        {...styles(
          'sheet.content',
          cn(
            'fixed z-50 overflow-y-auto border bg-surface p-6 text-foreground shadow-popover',
            side === 'bottom'
              ? 'ui-drawer inset-x-0 bottom-0 max-h-[90dvh] rounded-t-ui'
              : 'ui-sheet inset-y-0 w-[min(400px,calc(100%-32px))]',
            side === 'left'
              ? 'left-0 border-r data-[side=left]:[--sheet-direction:-100%]'
              : side === 'right'
                ? 'right-0 border-l'
                : 'border-t',
          ),
          className,
          unstyled,
        )}
        data-side={side}
        {...props}
      >
        {children}
        {showClose && (
          <DialogClose
            {...styles(
              'sheet.close',
              'absolute top-4 end-4 flex size-7 items-center justify-center rounded-ui text-muted-foreground hover:bg-muted',
              undefined,
              unstyled,
            )}
            aria-label="Close panel"
          >
            <X {...styles('sheet.close-icon', 'size-4', undefined, unstyled)} aria-hidden="true" />
          </DialogClose>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
SheetContent.displayName = 'SheetContent';
export const Drawer = Sheet;
export const DrawerTrigger = SheetTrigger;
export const DrawerClose = SheetClose;
export const DrawerTitle = SheetTitle;
export const DrawerDescription = SheetDescription;
export const DrawerContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  Omit<React.ComponentPropsWithoutRef<typeof SheetContent>, 'side'>
>((props, ref) => <SheetContent ref={ref} side="bottom" {...props} />);
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
          'ui-overlay fixed inset-0 z-50 bg-black/40',
          undefined,
          unstyled,
        )}
      />
      <AlertDialogPrimitive.Content
        ref={ref}
        {...styles(
          'alert-dialog.content',
          'ui-dialog fixed top-1/2 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-ui border bg-surface p-6 text-foreground shadow-popover',
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
          'ui-popup z-50 max-w-[calc(100vw-32px)] rounded-ui border bg-surface p-4 text-foreground shadow-popover outline-none',
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
          'ui-popup z-[70] max-w-64 rounded-ui bg-foreground px-3 py-2 text-xs leading-5 text-background shadow-popover',
          className,
          unstyled,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow
          {...styles('tooltip.arrow', 'fill-foreground', undefined, unstyled)}
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
  'ui-popup z-50 min-w-44 max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto rounded-ui border bg-surface p-1 text-foreground shadow-popover';
const menuItem =
  'relative flex min-h-9 cursor-default select-none items-center gap-2 rounded-[min(var(--ui-radius),4px)] px-3 py-2 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-45 [&_svg]:size-4 [&_svg]:text-muted-foreground';
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
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return (
    <DropdownPrimitive.SubContent
      ref={ref}
      {...styles('dropdown-menu.content', menuContent, className, unstyled)}
      {...props}
    />
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
export function Toaster({ toastOptions, unstyled, ...props }: ToasterProps) {
  const styles = useStyles();
  const dir = useDirection(props.dir === 'auto' ? undefined : props.dir);
  const isUnstyled = unstyled ?? styles.unstyled;
  return (
    <Sonner
      dir={dir}
      position={dir === 'rtl' ? 'bottom-left' : 'bottom-right'}
      closeButton
      gap={8}
      toastOptions={{
        unstyled: isUnstyled,
        ...toastOptions,
        style: isUnstyled
          ? toastOptions?.style
          : {
              background: 'var(--ui-surface)',
              color: 'var(--ui-foreground)',
              border: '1px solid var(--ui-border)',
              borderRadius: 'var(--ui-radius)',
              fontFamily: 'var(--ui-font)',
              ...toastOptions?.style,
            },
      }}
      {...props}
    />
  );
}
export { toast };
