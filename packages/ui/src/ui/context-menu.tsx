import * as React from 'react';
import { ContextMenu as ContextPrimitive, Slot } from 'radix-ui';
import {
  type PlainStyleProps,
  useDirection,
  StyleProvider,
  useStyles,
  usePortalContainer,
} from './style-context';
import { Check, Circle, ChevronRight } from 'lucide-react';

export function ContextMenu({
  unstyled,
  children,
  dir,
  ...props
}: React.ComponentProps<typeof ContextPrimitive.Root> & PlainStyleProps) {
  const direction = useDirection(dir);
  return (
    <StyleProvider unstyled={unstyled}>
      <ContextPrimitive.Root dir={direction} {...props}>
        {children}
      </ContextPrimitive.Root>
    </StyleProvider>
  );
}

export const ContextMenuGroup = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Group> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<ContextPrimitive.Group {...props} ref={ref} />, unstyled);
});

ContextMenuGroup.displayName = 'ContextMenuGroup';

export const ContextMenuRadioGroup = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.RadioGroup>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.RadioGroup> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<ContextPrimitive.RadioGroup {...props} ref={ref} />, unstyled);
});

ContextMenuRadioGroup.displayName = 'ContextMenuRadioGroup';

export const ContextMenuSub = ContextPrimitive.Sub;

export const ContextMenuTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Trigger> & PlainStyleProps
>(({ className, unstyled, disabled, onKeyDown, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <ContextPrimitive.Trigger
      ref={ref}
      disabled={disabled}
      aria-haspopup={disabled ? undefined : 'menu'}
      {...styles('context-menu.trigger', 'ui-context-menu-trigger', className, unstyled)}
      {...props}
      tabIndex={disabled ? -1 : (props.tabIndex ?? 0)}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled) return;
        if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
          event.preventDefault();
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.dispatchEvent(
            new MouseEvent('contextmenu', {
              bubbles: true,
              cancelable: true,
              clientX: rect.left + 8,
              clientY: rect.bottom,
            }),
          );
        }
      }}
    />,
    unstyled,
  );
});

ContextMenuTrigger.displayName = 'ContextMenuTrigger';

export const ContextMenuContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Content> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();

  const container = usePortalContainer();
  return (
    <StyleProvider unstyled={unstyled}>
      <ContextPrimitive.Portal container={container}>
        {styles.tooltip(
          <ContextPrimitive.Content
            ref={ref}
            collisionPadding={8}
            {...styles('context-menu.content', 'ui-menu-content', className, unstyled)}
            {...props}
          >
            {children}
          </ContextPrimitive.Content>,
          unstyled,
        )}
      </ContextPrimitive.Portal>
    </StyleProvider>
  );
});

ContextMenuContent.displayName = 'ContextMenuContent';

export const ContextMenuItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Item> &
    PlainStyleProps & { inset?: boolean; shortcut?: React.ReactNode }
>(({ className, unstyled, inset, shortcut, children, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <ContextPrimitive.Item
      ref={ref}
      data-inset={inset || undefined}
      {...styles('context-menu.item', 'ui-menu-item', className, unstyled)}
      {...props}
    >
      <Slot.Slottable>{children}</Slot.Slottable>
      {shortcut && (
        <kbd {...styles('context-menu.shortcut', 'ui-menu-shortcut', undefined, unstyled)}>
          {shortcut}
        </kbd>
      )}
    </ContextPrimitive.Item>,
    unstyled,
  );
});

ContextMenuItem.displayName = 'ContextMenuItem';

export const ContextMenuCheckboxItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.CheckboxItem> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <ContextPrimitive.CheckboxItem
      ref={ref}
      {...styles('context-menu.checkbox-item', 'ui-menu-item ui-menu-choice', className, unstyled)}
      {...props}
    >
      <ContextPrimitive.ItemIndicator
        {...styles('context-menu.item-indicator', 'ui-menu-indicator', undefined, unstyled)}
      >
        <Check size={16} aria-hidden="true" />
      </ContextPrimitive.ItemIndicator>
      {children}
    </ContextPrimitive.CheckboxItem>,
    unstyled,
  );
});

ContextMenuCheckboxItem.displayName = 'ContextMenuCheckboxItem';

export const ContextMenuRadioItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.RadioItem> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <ContextPrimitive.RadioItem
      ref={ref}
      {...styles('context-menu.radio-item', 'ui-menu-item ui-menu-choice', className, unstyled)}
      {...props}
    >
      <ContextPrimitive.ItemIndicator
        {...styles('context-menu.radio-indicator', 'ui-menu-indicator', undefined, unstyled)}
      >
        <Circle size={8} fill="currentColor" aria-hidden="true" />
      </ContextPrimitive.ItemIndicator>
      {children}
    </ContextPrimitive.RadioItem>,
    unstyled,
  );
});

ContextMenuRadioItem.displayName = 'ContextMenuRadioItem';

export const ContextMenuLabel = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Label> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <ContextPrimitive.Label
      ref={ref}
      {...styles('context-menu.label', 'ui-menu-label', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

ContextMenuLabel.displayName = 'ContextMenuLabel';

export const ContextMenuSeparator = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.Separator> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <ContextPrimitive.Separator
      ref={ref}
      {...styles('context-menu.separator', 'ui-menu-separator', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

ContextMenuSeparator.displayName = 'ContextMenuSeparator';

export const ContextMenuSubTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.SubTrigger> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <ContextPrimitive.SubTrigger
      ref={ref}
      {...styles(
        'context-menu.sub-trigger',
        'ui-menu-item ui-menu-sub-trigger',
        className,
        unstyled,
      )}
      {...props}
    >
      <Slot.Slottable>{children}</Slot.Slottable>
      <ChevronRight
        {...styles('context-menu.sub-icon', 'ui-menu-sub-icon', undefined, unstyled)}
        aria-hidden="true"
      />
    </ContextPrimitive.SubTrigger>,
    unstyled,
  );
});

ContextMenuSubTrigger.displayName = 'ContextMenuSubTrigger';

export const ContextMenuSubContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ContextPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextPrimitive.SubContent> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  const container = usePortalContainer();
  return (
    <ContextPrimitive.Portal container={container}>
      {styles.tooltip(
        <ContextPrimitive.SubContent
          ref={ref}
          collisionPadding={8}
          {...styles('context-menu.sub-content', 'ui-menu-content', className, unstyled)}
          {...props}
        />,
        unstyled,
      )}
    </ContextPrimitive.Portal>
  );
});

ContextMenuSubContent.displayName = 'ContextMenuSubContent';
