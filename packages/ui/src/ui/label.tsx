import * as React from 'react';
import { Label as LabelPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles } from './style-context';

export const Label = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <LabelPrimitive.Root
      ref={ref}
      {...styles(
        'label.root',
        'text-sm font-medium leading-5 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
        unstyled,
      )}
      {...props}
    />,
    unstyled,
  );
});

Label.displayName = 'Label';
