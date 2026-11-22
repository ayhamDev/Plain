import * as React from 'react';
import { Menubar as MenubarPrimitive, Slot } from 'radix-ui';
import {
  type PlainStyleProps,
  useStyles,
  useDirection,
  StyleProvider,
  usePortalContainer,
} from './style-context';
import { Check, Circle, ChevronRight } from 'lucide-react';

export type MenubarProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root> &
  PlainStyleProps;

export const Menubar = /* @__PURE__ */ React.forwardRef<HTMLDivElement, MenubarProps>(
  ({ className, unstyled, dir, children, ...props }, ref) => {
    const styles = useStyles();

    const direction = useDirection(dir);
    return (
      <StyleProvider unstyled={unstyled}>
        {styles.tooltip(
          <MenubarPrimitive.Root
            ref={ref}
            dir={direction}
            {...styles('menubar.root', 'ui-menubar', className, unstyled)}
            {...props}
          >
            {children}
          </MenubarPrimitive.Root>,
          unstyled,
        )}
      </StyleProvider>
    );
  },
);

Menubar.displayName = 'Menubar';

export const MenubarMenu = MenubarPrimitive.Menu;

export const MenubarGroup = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Group> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<MenubarPrimitive.Group {...props} ref={ref} />, unstyled);
});

MenubarGroup.displayName = 'MenubarGroup';

export const MenubarRadioGroup = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioGroup>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioGroup> & PlainStyleProps
>(({ unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(<MenubarPrimitive.RadioGroup {...props} ref={ref} />, unstyled);
});

MenubarRadioGroup.displayName = 'MenubarRadioGroup';

export const MenubarSub = MenubarPrimitive.Sub;

export const MenubarTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <MenubarPrimitive.Trigger
      ref={ref}
      {...styles('menubar.trigger', 'ui-menubar-trigger', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

MenubarTrigger.displayName = 'MenubarTrigger';

export const MenubarContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();

  const container = usePortalContainer();
  return (
    <StyleProvider unstyled={unstyled}>
      <MenubarPrimitive.Portal container={container}>
        {styles.tooltip(
          <MenubarPrimitive.Content
            ref={ref}
            align="start"
            sideOffset={4}
            collisionPadding={8}
            {...styles('menubar.content', 'ui-menu-content', className, unstyled)}
            {...props}
          >
            {children}
          </MenubarPrimitive.Content>,
          unstyled,
        )}
      </MenubarPrimitive.Portal>
    </StyleProvider>
  );
});

MenubarContent.displayName = 'MenubarContent';

export const MenubarItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> &
    PlainStyleProps & { inset?: boolean; shortcut?: React.ReactNode }
>(({ className, unstyled, inset, shortcut, children, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <MenubarPrimitive.Item
      ref={ref}
      data-inset={inset || undefined}
      {...styles('menubar.item', 'ui-menu-item', className, unstyled)}
      {...props}
    >
      <Slot.Slottable>{children}</Slot.Slottable>
      {shortcut && (
        <kbd {...styles('menubar.shortcut', 'ui-menu-shortcut', undefined, unstyled)}>
          {shortcut}
        </kbd>
      )}
    </MenubarPrimitive.Item>,
    unstyled,
  );
});

MenubarItem.displayName = 'MenubarItem';

export const MenubarCheckboxItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <MenubarPrimitive.CheckboxItem
      ref={ref}
      {...styles('menubar.checkbox-item', 'ui-menu-item ui-menu-choice', className, unstyled)}
      {...props}
    >
      <MenubarPrimitive.ItemIndicator
        {...styles('menubar.item-indicator', 'ui-menu-indicator', undefined, unstyled)}
      >
        <Check size={16} aria-hidden="true" />
      </MenubarPrimitive.ItemIndicator>
      {children}
    </MenubarPrimitive.CheckboxItem>,
    unstyled,
  );
});

MenubarCheckboxItem.displayName = 'MenubarCheckboxItem';

export const MenubarRadioItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <MenubarPrimitive.RadioItem
      ref={ref}
      {...styles('menubar.radio-item', 'ui-menu-item ui-menu-choice', className, unstyled)}
      {...props}
    >
      <MenubarPrimitive.ItemIndicator
        {...styles('menubar.radio-indicator', 'ui-menu-indicator', undefined, unstyled)}
      >
        <Circle size={8} fill="currentColor" aria-hidden="true" />
      </MenubarPrimitive.ItemIndicator>
      {children}
    </MenubarPrimitive.RadioItem>,
    unstyled,
  );
});

MenubarRadioItem.displayName = 'MenubarRadioItem';

export const MenubarLabel = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <MenubarPrimitive.Label
      ref={ref}
      {...styles('menubar.label', 'ui-menu-label', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

MenubarLabel.displayName = 'MenubarLabel';

export const MenubarSeparator = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <MenubarPrimitive.Separator
      ref={ref}
      {...styles('menubar.separator', 'ui-menu-separator', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

MenubarSeparator.displayName = 'MenubarSeparator';

export const MenubarSubTrigger = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & PlainStyleProps
>(({ className, unstyled, children, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <MenubarPrimitive.SubTrigger
      ref={ref}
      {...styles('menubar.sub-trigger', 'ui-menu-item ui-menu-sub-trigger', className, unstyled)}
      {...props}
    >
      <Slot.Slottable>{children}</Slot.Slottable>
      <ChevronRight
        {...styles('menubar.sub-icon', 'ui-menu-sub-icon', undefined, unstyled)}
        aria-hidden="true"
      />
    </MenubarPrimitive.SubTrigger>,
    unstyled,
  );
});

MenubarSubTrigger.displayName = 'MenubarSubTrigger';

export const MenubarSubContent = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  const container = usePortalContainer();
  return (
    <MenubarPrimitive.Portal container={container}>
      {styles.tooltip(
        <MenubarPrimitive.SubContent
          ref={ref}
          collisionPadding={8}
          {...styles('menubar.sub-content', 'ui-menu-content', className, unstyled)}
          {...props}
        />,
        unstyled,
      )}
    </MenubarPrimitive.Portal>
  );
});

MenubarSubContent.displayName = 'MenubarSubContent';
