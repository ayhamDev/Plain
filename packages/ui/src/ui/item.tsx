import * as React from 'react';
import { Slot } from 'radix-ui';
import { StyleProvider, useStyles, type PlainStyleProps } from './styling';

export interface ItemProps extends React.ButtonHTMLAttributes<HTMLElement>, PlainStyleProps {
  /** Compose onto a native button, link or application component. */
  asChild?: boolean;
  /** False renders a content row; its nested controls keep their own semantics. */
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
}

function blockActivation(event: React.SyntheticEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

export const Item = /* @__PURE__ */ React.forwardRef<HTMLElement, ItemProps>(
  (
    {
      asChild,
      interactive = true,
      size = 'md',
      selected,
      defaultSelected,
      onSelectedChange,
      disabled = false,
      type = 'button',
      className,
      unstyled,
      children,
      onClick,
      onClickCapture,
      onAuxClickCapture,
      onKeyDownCapture,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const [localSelected, setLocalSelected] = React.useState(defaultSelected ?? false);
    const active = selected ?? localSelected;
    const selectable =
      selected !== undefined || defaultSelected !== undefined || onSelectedChange !== undefined;
    const child =
      asChild &&
      React.isValidElement<
        React.HTMLAttributes<HTMLElement> & { disabled?: boolean; href?: string }
      >(children)
        ? children
        : undefined;
    const childTag = child && typeof child.type === 'string' ? child.type : undefined;
    const role = child?.props.role ?? props.role;
    const nativeButton = (!asChild && interactive) || childTag === 'button';
    const selectedRole = role && ['option', 'tab', 'row', 'treeitem', 'gridcell'].includes(role);
    const content =
      child && disabled
        ? React.cloneElement(child, {
            tabIndex: -1,
            'aria-disabled': true,
            ...(childTag === 'button' ? { disabled: true } : {}),
            ...(childTag === 'a' ? { href: undefined } : {}),
            onClick: blockActivation,
            onClickCapture: blockActivation,
            onAuxClickCapture: blockActivation,
            onKeyDownCapture: (event) => {
              if (event.key === 'Enter' || event.key === ' ') blockActivation(event);
            },
          })
        : children;
    const Element: React.ElementType = asChild ? Slot.Root : interactive ? 'button' : 'div';
    return (
      <StyleProvider unstyled={unstyled}>
        {styles.tooltip(
          <Element
            ref={ref}
            type={!asChild && interactive ? type : undefined}
            disabled={!asChild && interactive ? disabled : undefined}
            aria-disabled={disabled || undefined}
            aria-pressed={
              selectable && nativeButton && (!role || role === 'button') ? active : undefined
            }
            aria-selected={selectable && selectedRole ? active : undefined}
            aria-current={
              selectable && active && childTag === 'a' && (!role || role === 'link')
                ? true
                : undefined
            }
            {...styles('item.root', 'ui-item w-full', className, unstyled)}
            data-size={size}
            data-interactive={interactive || undefined}
            data-selected={active || undefined}
            data-disabled={disabled || undefined}
            {...props}
            tabIndex={asChild && disabled ? -1 : props.tabIndex}
            onClickCapture={(event: React.MouseEvent<HTMLElement>) => {
              if (disabled) blockActivation(event);
              else onClickCapture?.(event);
            }}
            onAuxClickCapture={(event: React.MouseEvent<HTMLElement>) => {
              if (disabled) blockActivation(event);
              else onAuxClickCapture?.(event);
            }}
            onKeyDownCapture={(event: React.KeyboardEvent<HTMLElement>) => {
              if (disabled && (event.key === 'Enter' || event.key === ' ')) blockActivation(event);
              else onKeyDownCapture?.(event);
            }}
            onClick={(event: React.MouseEvent<HTMLElement>) => {
              if (disabled) {
                blockActivation(event);
                return;
              }
              onClick?.(event);
              if (event.defaultPrevented || !interactive || !selectable) return;
              if (selected === undefined) setLocalSelected(!active);
              onSelectedChange?.(!active);
            }}
          >
            {content}
          </Element>,
          unstyled,
        )}
      </StyleProvider>
    );
  },
);
Item.displayName = 'Item';

export type ItemPartProps = React.HTMLAttributes<HTMLSpanElement> &
  PlainStyleProps & { asChild?: boolean };
export const ItemMedia = /* @__PURE__ */ React.forwardRef<HTMLSpanElement, ItemPartProps>(
  ({ className, unstyled, asChild, ...props }, ref) => {
    const styles = useStyles();
    const Element = asChild ? Slot.Root : 'span';
    return styles.tooltip(
      <Element
        ref={ref}
        {...styles('item.media', 'ui-item-media', className, unstyled)}
        {...props}
      />,
      unstyled,
    );
  },
);
ItemMedia.displayName = 'ItemMedia';
export const ItemContent = /* @__PURE__ */ React.forwardRef<HTMLSpanElement, ItemPartProps>(
  ({ className, unstyled, asChild, ...props }, ref) => {
    const styles = useStyles();
    const Element = asChild ? Slot.Root : 'span';
    return styles.tooltip(
      <Element
        ref={ref}
        {...styles('item.content', 'ui-item-content', className, unstyled)}
        {...props}
      />,
      unstyled,
    );
  },
);
ItemContent.displayName = 'ItemContent';
export const ItemTitle = /* @__PURE__ */ React.forwardRef<HTMLSpanElement, ItemPartProps>(
  ({ className, unstyled, asChild, ...props }, ref) => {
    const styles = useStyles();
    const Element = asChild ? Slot.Root : 'span';
    return styles.tooltip(
      <Element
        ref={ref}
        {...styles('item.title', 'ui-item-title', className, unstyled)}
        {...props}
      />,
      unstyled,
    );
  },
);
ItemTitle.displayName = 'ItemTitle';
export const ItemDescription = /* @__PURE__ */ React.forwardRef<HTMLSpanElement, ItemPartProps>(
  ({ className, unstyled, asChild, ...props }, ref) => {
    const styles = useStyles();
    const Element = asChild ? Slot.Root : 'span';
    return styles.tooltip(
      <Element
        ref={ref}
        {...styles('item.description', 'ui-item-description', className, unstyled)}
        {...props}
      />,
      unstyled,
    );
  },
);
ItemDescription.displayName = 'ItemDescription';
export const ItemTrailing = /* @__PURE__ */ React.forwardRef<HTMLSpanElement, ItemPartProps>(
  ({ className, unstyled, asChild, ...props }, ref) => {
    const styles = useStyles();
    const Element = asChild ? Slot.Root : 'span';
    return styles.tooltip(
      <Element
        ref={ref}
        {...styles('item.trailing', 'ui-item-trailing', className, unstyled)}
        {...props}
      />,
      unstyled,
    );
  },
);
ItemTrailing.displayName = 'ItemTrailing';
export const ItemActions = /* @__PURE__ */ React.forwardRef<HTMLSpanElement, ItemPartProps>(
  ({ className, unstyled, asChild, ...props }, ref) => {
    const styles = useStyles();
    const Element = asChild ? Slot.Root : 'span';
    return styles.tooltip(
      <Element
        ref={ref}
        {...styles('item.actions', 'ui-item-actions', className, unstyled)}
        {...props}
      />,
      unstyled,
    );
  },
);
ItemActions.displayName = 'ItemActions';
