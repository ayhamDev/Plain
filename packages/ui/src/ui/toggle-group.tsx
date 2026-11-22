import * as React from 'react';
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles } from './style-context';
import { type VariantProps } from 'class-variance-authority';
import { toggleVariants } from './toggle';

export const ToggleGroup = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <ToggleGroupPrimitive.Root
      ref={ref}
      {...styles('toggle-group.root', 'inline-flex items-center gap-1', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

ToggleGroup.displayName = 'ToggleGroup';

export const ToggleGroupItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  (React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>) &
    PlainStyleProps
>(({ className, variant, size, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <ToggleGroupPrimitive.Item
      ref={ref}
      {...styles('toggle-group.item', toggleVariants({ variant, size }), className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

ToggleGroupItem.displayName = 'ToggleGroupItem';
