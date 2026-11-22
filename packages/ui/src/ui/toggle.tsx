import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Toggle as TogglePrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles } from './style-context';

export const toggleVariants = /* @__PURE__ */ cva(
  'ui-interactive inline-flex items-center justify-center gap-2 rounded-ui border text-sm font-medium hover:bg-muted data-[state=on]:bg-accent-soft data-[state=on]:text-accent disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4',
  {
    variants: {
      variant: { default: 'border-transparent', outline: 'border-border' },
      size: { sm: 'h-8 min-w-8 px-2', md: 'h-9 min-w-9 px-3', lg: 'h-11 min-w-11 px-4' },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export const Toggle = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  (React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>) &
    PlainStyleProps
>(({ className, variant, size, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <TogglePrimitive.Root
      ref={ref}
      {...styles('toggle.root', toggleVariants({ variant, size }), className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

Toggle.displayName = 'Toggle';
