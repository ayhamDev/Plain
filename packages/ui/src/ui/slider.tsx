import * as React from 'react';
import { Slider as SliderPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles } from './style-context';
import { useTranslation } from './i18n';

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, PlainStyleProps {
  thumbLabels?: string[];
}

export const Slider = /* @__PURE__ */ React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps & PlainStyleProps
>(({ className, thumbLabels, unstyled, ...props }, ref) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const values = props.value ?? props.defaultValue ?? [0];
  return styles.tooltip(
    <SliderPrimitive.Root
      ref={ref}
      {...styles(
        'slider.root',
        'ui-slider relative flex h-10 w-full touch-none select-none items-center data-[orientation=vertical]:h-40 data-[orientation=vertical]:w-10 data-[orientation=vertical]:flex-col data-[disabled]:opacity-45',
        className,
        unstyled,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        {...styles(
          'slider.track',
          'relative h-1.5 w-full grow overflow-hidden rounded-full bg-[var(--ui-slider-track,var(--ui-border))] data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5',
          undefined,
          unstyled,
        )}
      >
        <SliderPrimitive.Range
          {...styles(
            'slider.range',
            'absolute h-full rounded-full bg-[var(--ui-slider-range,var(--ui-accent))] data-[orientation=vertical]:w-full',
            undefined,
            unstyled,
          )}
        />
      </SliderPrimitive.Track>
      {values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={
            thumbLabels?.[i] ??
            props['aria-label'] ??
            (values.length > 1 ? t('input.indexedValue', { index: i + 1 }) : t('input.value'))
          }
          {...styles(
            'slider.thumb',
            'ui-interactive block size-5 rounded-full border border-border bg-[var(--ui-slider-thumb,var(--ui-surface))] shadow-sm hover:shadow-[0_0_0_5px_var(--ui-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent data-[disabled]:pointer-events-none',
            undefined,
            unstyled,
          )}
        />
      ))}
    </SliderPrimitive.Root>,
    unstyled,
  );
});

Slider.displayName = 'Slider';
