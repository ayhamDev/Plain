import * as React from 'react';
import { DropdownMenu as DropdownPrimitive } from 'radix-ui';
import { useModalInert } from './modal-accessibility';
import { type PlainStyleProps, useStyles, usePortalContainer } from './style-context';
import { cn } from './utils';
import { Check, Circle, ChevronRight } from 'lucide-react';

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

export const DropdownMenuTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Trigger> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<DropdownPrimitive.Trigger {...props} ref={ref} />, unstyled);
});

DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export const DropdownMenuGroup = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Group> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<DropdownPrimitive.Group {...props} ref={ref} />, unstyled);
});

DropdownMenuGroup.displayName = 'DropdownMenuGroup';

export const DropdownMenuSub = DropdownPrimitive.Sub;

export const DropdownMenuRadioGroup = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.RadioGroup>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.RadioGroup> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<DropdownPrimitive.RadioGroup {...props} ref={ref} />, unstyled);
});

DropdownMenuRadioGroup.displayName = 'DropdownMenuRadioGroup';

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
      {styles.tooltip(
        <DropdownPrimitive.Content
          ref={ref}
          sideOffset={sideOffset}
          {...styles('dropdown-menu.content', menuContent, className, unstyled)}
          {...props}
        />,
        unstyled,
      )}
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
  return styles.tooltip(
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
    />,
    unstyled,
  );
});

DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuCheckboxItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.CheckboxItem> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
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
    </DropdownPrimitive.CheckboxItem>,
    unstyled,
  );
});

DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

export const DropdownMenuRadioItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.RadioItem> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
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
    </DropdownPrimitive.RadioItem>,
    unstyled,
  );
});

DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

export const DropdownMenuLabel = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Label> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <DropdownPrimitive.Label
      ref={ref}
      {...styles(
        'dropdown-menu.label',
        'px-3 py-2 text-xs font-medium text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});

DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export const DropdownMenuSeparator = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <DropdownPrimitive.Separator
      ref={ref}
      {...styles('dropdown-menu.separator', 'my-1 h-px bg-border', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export const DropdownMenuSubTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.SubTrigger> & PlainStyleProps
>(({ className, children, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
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
    </DropdownPrimitive.SubTrigger>,
    unstyled,
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
      {styles.tooltip(
        <DropdownPrimitive.SubContent
          ref={ref}
          collisionPadding={8}
          avoidCollisions={avoidCollisions}
          data-collision-aware={avoidCollisions || undefined}
          {...styles('dropdown-menu.content', cn(menuContent, 'ui-submenu'), className, unstyled)}
          {...props}
        />,
        unstyled,
      )}
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
  return styles.tooltip(
    <span
      {...styles(
        'dropdown-menu.shortcut',
        'ms-auto text-xs text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
}
