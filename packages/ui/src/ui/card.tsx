import * as React from 'react';
import { type PlainStyleProps, useStyles, StyleProvider } from './style-context';
import { type LayoutPresenceProps, useLayoutPresence } from './layout-presence';
import { Slot } from 'radix-ui';

export interface CardProps
  extends React.ComponentPropsWithoutRef<'div'>, PlainStyleProps, LayoutPresenceProps {
  asChild?: boolean;
  variant?: 'outlined' | 'filled' | 'elevated' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  selected?: boolean;
}

export const Card = /* @__PURE__ */ Object.assign(
  /* @__PURE__ */ React.forwardRef<HTMLDivElement, CardProps>(
    (
      {
        className,
        unstyled,
        asChild,
        variant = 'outlined',
        size = 'md',
        interactive = false,
        selected = false,
        presence,
        children,
        ...props
      },
      ref,
    ) => {
      const styles = useStyles();
      const scope = useLayoutPresence(children, presence, ref, asChild);
      const Element = asChild ? Slot.Root : 'div';

      return (
        <StyleProvider unstyled={unstyled}>
          {styles.tooltip(
            <Element
              ref={scope.ref}
              children={scope.children}
              data-variant={variant}
              data-size={size}
              data-interactive={interactive || undefined}
              data-selected={selected || undefined}
              {...styles(
                'card.root',
                'ui-card rounded-[var(--ui-card-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-[var(--ui-card-border,var(--ui-border))] bg-[color-mix(in_srgb,var(--ui-card-foreground,var(--ui-foreground))_var(--_ui-card-state-opacity,0%),var(--ui-card-background,var(--ui-surface)))] text-[var(--ui-card-foreground,var(--ui-foreground))]',
                className,
                unstyled,
              )}
              {...props}
            />,
            unstyled,
          )}
        </StyleProvider>
      );
    },
  ),
  { displayName: 'Card' },
);

export const CardHeader = /* @__PURE__ */ Object.assign(
  /* @__PURE__ */ React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<'div'> & PlainStyleProps & LayoutPresenceProps
  >(({ className, unstyled, presence, children, ...props }, ref) => {
    const styles = useStyles();
    const scope = useLayoutPresence(children, presence, ref);

    return styles.tooltip(
      <div
        ref={scope.ref}
        children={scope.children}
        {...styles('card.header', 'ui-card-header flex flex-col gap-1.5', className, unstyled)}
        {...props}
      />,
      unstyled,
    );
  }),
  { displayName: 'CardHeader' },
);

export function CardTitle({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'h3'> & PlainStyleProps) {
  const styles = useStyles();

  return styles.tooltip(
    <h3
      {...styles('card.title', 'text-base font-semibold leading-6', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
}

export function CardDescription({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'p'> & PlainStyleProps) {
  const styles = useStyles();

  return styles.tooltip(
    <p
      {...styles(
        'card.description',
        'ui-card-description text-sm leading-6 text-[var(--_ui-card-description-color,var(--ui-muted-foreground))]',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
}

export const CardContent = /* @__PURE__ */ Object.assign(
  /* @__PURE__ */ React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<'div'> & PlainStyleProps & LayoutPresenceProps
  >(({ className, unstyled, presence, children, ...props }, ref) => {
    const styles = useStyles();
    const scope = useLayoutPresence(children, presence, ref);

    return styles.tooltip(
      <div
        ref={scope.ref}
        children={scope.children}
        {...styles('card.content', 'ui-card-content', className, unstyled)}
        {...props}
      />,
      unstyled,
    );
  }),
  { displayName: 'CardContent' },
);

export const CardFooter = /* @__PURE__ */ Object.assign(
  /* @__PURE__ */ React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<'div'> & PlainStyleProps & LayoutPresenceProps
  >(({ className, unstyled, presence, children, ...props }, ref) => {
    const styles = useStyles();
    const scope = useLayoutPresence(children, presence, ref);

    return styles.tooltip(
      <div
        ref={scope.ref}
        children={scope.children}
        {...styles(
          'card.footer',
          'ui-card-footer flex flex-wrap items-center gap-2',
          className,
          unstyled,
        )}
        {...props}
      />,
      unstyled,
    );
  }),
  { displayName: 'CardFooter' },
);
