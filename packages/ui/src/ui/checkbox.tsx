import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles } from './style-context';
import { Minus, Check } from 'lucide-react';

export const Checkbox = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  return styles.tooltip(
    <CheckboxPrimitive.Root
      ref={ref}
      {...styles(
        'checkbox.root',
        'ui-interactive peer flex size-4.5 shrink-0 items-center justify-center rounded-[var(--ui-checkbox-radius,min(var(--ui-radius),4px))] border-[length:var(--ui-border-width,1px)] border-[var(--ui-checkbox-border)] bg-[var(--ui-checkbox-background,var(--ui-surface))] text-[var(--ui-checkbox-foreground,var(--ui-accent-foreground))] data-[state=checked]:border-[var(--ui-checkbox-checked,var(--ui-accent))] data-[state=checked]:bg-[var(--ui-checkbox-checked,var(--ui-accent))] data-[state=indeterminate]:border-[var(--ui-checkbox-checked,var(--ui-accent))] data-[state=indeterminate]:bg-[var(--ui-checkbox-checked,var(--ui-accent))] disabled:cursor-not-allowed disabled:opacity-45',
        className,
        unstyled,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        {...styles(
          'checkbox.indicator',
          'ui-state-indicator flex items-center justify-center',
          undefined,
          unstyled,
        )}
      >
        <Minus
          {...styles(
            'checkbox.indeterminate-icon',
            'hidden size-3.5 [[data-state=indeterminate]>&]:block',
            undefined,
            unstyled,
          )}
          aria-hidden="true"
        />
        <Check
          {...styles(
            'checkbox.icon',
            'size-3.5 [[data-state=indeterminate]>&]:hidden',
            undefined,
            unstyled,
          )}
          strokeWidth={3}
          aria-hidden="true"
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>,
    unstyled,
  );
});

Checkbox.displayName = 'Checkbox';
