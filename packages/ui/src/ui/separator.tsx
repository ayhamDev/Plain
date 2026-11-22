import * as React from 'react';
import { Separator as SeparatorPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles } from './style-context';
import { cn } from './utils';

export const Separator = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & PlainStyleProps
>(({ className, orientation = 'horizontal', decorative = true, unstyled, ...props }, ref) => {
  const styles = useStyles();

  return styles.tooltip(
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      {...styles(
        'separator.root',
        cn('shrink-0 bg-border', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px'),
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});

Separator.displayName = 'Separator';
