import * as React from 'react';
import { Switch as SwitchPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles, useDirection } from './style-context';

export const Switch = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & PlainStyleProps
>(({ className, unstyled, ...props }, ref) => {
  const styles = useStyles();
  const dir = useDirection(props.dir === 'rtl' || props.dir === 'ltr' ? props.dir : undefined);
  return styles.tooltip(
    <SwitchPrimitive.Root
      ref={ref}
      dir={dir}
      {...styles(
        'switch.root',
        'ui-interactive ui-switch peer relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-[var(--ui-switch-radius,var(--ui-radius))] border-[length:var(--ui-border-width,1px)] border-[var(--ui-switch-border)] bg-[var(--ui-switch-background,var(--ui-border))] p-0.5 data-[state=checked]:border-[var(--ui-switch-checked,var(--ui-accent))] data-[state=checked]:bg-[var(--ui-switch-checked,var(--ui-accent))] disabled:cursor-not-allowed disabled:opacity-45',
        className,
        unstyled,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        {...styles(
          'switch.thumb',
          'ui-switch-thumb absolute top-1/2 block size-4 -translate-y-1/2 rounded-[var(--ui-switch-thumb-radius,max(0px,calc(var(--ui-switch-radius,var(--ui-radius))_-_2px)))] bg-[var(--ui-switch-thumb,white)] shadow-sm data-[state=unchecked]:bg-[var(--ui-switch-thumb-unchecked,var(--ui-foreground))]',
          undefined,
          unstyled,
        )}
      />
    </SwitchPrimitive.Root>,
    unstyled,
  );
});

Switch.displayName = 'Switch';
