import type * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';

export function Kbd({
  className,
  unstyled,
  ...props
}: React.ComponentProps<'kbd'> & PlainStyleProps) {
  const styles = useStyles();

  return styles.tooltip(
    <kbd
      {...styles(
        'kbd.root',
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface px-1 font-sans text-xs text-muted-foreground',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
}
