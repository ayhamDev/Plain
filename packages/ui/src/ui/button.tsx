import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { type PlainStyleProps, useStyles } from './style-context';
import { Slot } from 'radix-ui';
import { cn } from './utils';
import { LoaderCircle } from 'lucide-react';

export const buttonVariants = /* @__PURE__ */ cva(
  'ui-interactive inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--ui-button-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'border-[var(--ui-button-border,var(--ui-border))] bg-[var(--ui-button-background,var(--ui-foreground))] text-[var(--ui-button-foreground,var(--ui-background))] hover:opacity-85',
        accent: 'border-accent bg-accent text-accent-foreground hover:brightness-95',
        secondary: 'border-transparent bg-muted text-foreground hover:bg-border',
        outline: 'border-border bg-surface text-foreground hover:bg-muted',
        ghost: 'border-transparent bg-transparent text-foreground hover:bg-muted',
        destructive:
          'border-danger bg-danger text-[var(--ui-danger-foreground,var(--ui-background))] hover:brightness-95',
        link: 'border-transparent bg-transparent text-accent underline-offset-4 hover:underline',
      },
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-3',
        md: 'min-h-[var(--ui-button-height,var(--ui-control-height))] px-4 py-2',
        lg: 'h-12 px-5',
        icon: 'size-9 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants>,
    PlainStyleProps {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = /* @__PURE__ */ React.forwardRef<
  HTMLButtonElement,
  ButtonProps & PlainStyleProps
>(
  (
    {
      className,
      variant,
      size,
      asChild,
      loading,
      disabled,
      children,
      onClick,
      type = 'button',
      unstyled,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();

    const Component = asChild ? Slot.Root : 'button';
    const isDisabled = disabled || loading;
    const slottedChild =
      asChild && isDisabled && React.isValidElement<React.HTMLAttributes<HTMLElement>>(children)
        ? React.cloneElement(children, {
            tabIndex: -1,
            'aria-disabled': true,
            onClick: (event) => {
              event.preventDefault();
              event.stopPropagation();
            },
          })
        : children;
    return styles.tooltip(
      <Component
        ref={ref}
        type={asChild ? undefined : type}
        disabled={asChild ? undefined : isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        data-variant={variant === null ? undefined : (variant ?? 'primary')}
        data-size={size === null ? undefined : (size ?? 'md')}
        {...styles(
          'button.root',
          cn(buttonVariants({ variant, size }), isDisabled && 'pointer-events-none opacity-45'),
          className,
          unstyled,
        )}
        onClick={(e) => {
          if (isDisabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
        {...props}
        tabIndex={asChild && isDisabled ? -1 : props.tabIndex}
      >
        {asChild ? (
          slottedChild
        ) : (
          <>
            {loading && (
              <LoaderCircle
                {...styles('button.spinner', 'animate-spin', undefined, unstyled)}
                aria-hidden="true"
              />
            )}
            {children}
          </>
        )}
      </Component>,
      unstyled,
    );
  },
);

Button.displayName = 'Button';
