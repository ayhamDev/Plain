import * as React from 'react';
import { RadioGroup as RadioPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles } from './style-context';

export const RadioGroup = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof RadioPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioPrimitive.Root> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <RadioPrimitive.Root
      ref={ref}
      {...styles('radio-group.root', 'grid gap-3', className, unstyled)}
      {...props}
    />,
    unstyled,
  );
});

RadioGroup.displayName = 'RadioGroup';

export const RadioGroupItem = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof RadioPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioPrimitive.Item> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <RadioPrimitive.Item
      ref={ref}
      {...styles(
        'radio-group.item',
        'ui-interactive size-4.5 shrink-0 rounded-full border-[length:var(--ui-border-width,1px)] border-[var(--ui-radio-border)] bg-[var(--ui-radio-background)] text-[var(--ui-radio-checked,var(--ui-accent))] data-[state=checked]:border-[var(--ui-radio-checked,var(--ui-accent))] disabled:cursor-not-allowed disabled:opacity-45',
        className,
        unstyled,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        {...styles(
          'radio-group.indicator',
          'ui-state-indicator flex items-center justify-center',
          undefined,
          unstyled,
        )}
      >
        <span
          {...styles('radio-group.dot', 'size-2.5 rounded-full bg-current', undefined, unstyled)}
        />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Item>,
    unstyled,
  );
});

RadioGroupItem.displayName = 'RadioGroupItem';
