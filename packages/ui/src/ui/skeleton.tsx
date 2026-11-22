import * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';

export const Skeleton = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <div
      ref={ref}
      aria-hidden="true"
      {...styles(
        'skeleton.root',
        'ui-skeleton h-4 w-full rounded-[var(--ui-skeleton-radius,var(--ui-radius))] bg-[var(--ui-skeleton-background,var(--ui-border))]',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});

Skeleton.displayName = 'Skeleton';
