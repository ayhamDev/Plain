import type * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { type PlainStyleProps, useStyles } from './style-context';

export const badgeVariants = /* @__PURE__ */ cva(
  'inline-flex items-center gap-1.5 rounded-[var(--ui-badge-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] px-2 py-0.5 text-xs font-medium [&_svg]:size-3',
  {
    variants: {
      variant: {
        default:
          'border-border bg-[var(--ui-badge-background,var(--ui-muted))] text-[var(--ui-badge-foreground,var(--ui-foreground))]',
        accent: 'border-transparent bg-accent-soft text-accent-soft-foreground',
        outline: 'border-border text-muted-foreground',
        solid: 'border-transparent bg-foreground text-background',
        destructive:
          'border-transparent bg-danger-soft text-[var(--ui-danger-soft-foreground,var(--ui-danger))]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants>,
    PlainStyleProps {}

export function Badge({ className, variant, unstyled, ...props }: BadgeProps & PlainStyleProps) {
  const styles = useStyles();

  return styles.tooltip(
    <span
      data-variant={variant === null ? undefined : (variant ?? 'default')}
      {...styles('badge.root', badgeVariants({ variant }), className, unstyled)}
      {...props}
    />,
    unstyled,
  );
}
