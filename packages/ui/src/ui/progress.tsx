import * as React from 'react';
import { Progress as ProgressPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles, useDirection } from './style-context';
import { useTranslation, numberFormatter } from './i18n';
import { cn } from './utils';

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, PlainStyleProps {
  size?: 'sm' | 'md' | 'lg';
  segments?: readonly ProgressSegment[];
  showLegend?: boolean;
  formatValue?: (value: number, max: number) => string;
}

export interface ProgressSegment {
  id: string;
  label: string;
  value: number;
  color?: React.CSSProperties['backgroundColor'];
}

// Keep the name assignment tree-shakable with the component and its locale formatter.
export const Progress = /* @__PURE__ */ Object.assign(
  /* @__PURE__ */ React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
    (
      {
        className,
        value,
        max = 100,
        size = 'md',
        segments,
        showLegend = true,
        formatValue,
        unstyled,
        ...props
      },
      ref,
    ) => {
      const styles = useStyles();
      const { locale } = useTranslation();

      const direction = useDirection(
        props.dir === 'rtl' || props.dir === 'ltr' ? props.dir : undefined,
      );
      const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
      const parts = segments?.map((segment, index) => ({
        ...segment,
        value: Number.isFinite(segment.value) ? Math.max(0, segment.value) : 0,
        color: segment.color ?? `var(--ui-chart-${(index % 8) + 1})`,
      }));
      const total = parts?.reduce((sum, segment) => sum + segment.value, 0);
      const resolvedValue = total === Infinity ? safeMax : (total ?? value);
      const safeValue =
        resolvedValue == null || !Number.isFinite(resolvedValue)
          ? null
          : Math.max(0, Math.min(safeMax, resolvedValue));
      const formatter = numberFormatter(locale, { style: 'percent', maximumFractionDigits: 1 });
      const formatted = (amount: number) =>
        formatValue?.(amount, safeMax) ?? formatter.format(amount / safeMax);
      // Normalize before summing when finite allocations exceed Number.MAX_VALUE.
      const scale =
        total === Infinity ? parts!.reduce((largest, part) => Math.max(largest, part.value), 1) : 1;
      const denominator = Math.max(
        safeMax / scale,
        parts?.reduce((sum, part) => sum + part.value / scale, 0) ?? 0,
      );
      return (
        <>
          {styles.tooltip(
            <ProgressPrimitive.Root
              ref={ref}
              dir={direction}
              value={safeValue}
              max={safeMax}
              {...(parts
                ? {
                    'aria-valuetext': parts
                      .map((part) => `${part.label}: ${formatted(part.value)}`)
                      .join('; '),
                  }
                : {})}
              data-segmented={!!parts || undefined}
              {...styles(
                'progress.root',
                cn(
                  'ui-progress relative w-full overflow-hidden rounded-full bg-muted',
                  { sm: 'h-1', md: 'h-2', lg: 'h-3' }[size],
                ),
                className,
                unstyled,
              )}
              {...props}
            >
              {parts ? (
                parts.map((part) => (
                  <span
                    key={part.id}
                    aria-hidden="true"
                    title={`${part.label}: ${formatted(part.value)}`}
                    {...styles('progress.segment', 'ui-progress-segment', undefined, unstyled)}
                    style={{
                      width: `${(part.value / scale / denominator) * 100}%`,
                      backgroundColor: part.color,
                    }}
                  />
                ))
              ) : (
                <ProgressPrimitive.Indicator
                  {...styles(
                    'progress.indicator',
                    cn(
                      'ui-progress-indicator h-full rounded-full bg-accent',
                      safeValue === null && 'ui-progress-indeterminate',
                    ),
                    undefined,
                    unstyled,
                  )}
                  style={{
                    width: safeValue === null ? '40%' : `${(safeValue / safeMax) * 100}%`,
                    marginInlineStart: 0,
                  }}
                />
              )}
            </ProgressPrimitive.Root>,
            unstyled,
          )}
          {parts && showLegend && (
            <ul {...styles('progress.legend', 'ui-progress-legend', undefined, unstyled)}>
              {parts.map((part) => (
                <li key={part.id}>
                  <span
                    aria-hidden="true"
                    {...styles('progress.swatch', 'ui-progress-swatch', undefined, unstyled)}
                    style={{ backgroundColor: part.color }}
                  />
                  <bdi>{part.label}</bdi>
                  <bdi>{formatted(part.value)}</bdi>
                </li>
              ))}
            </ul>
          )}
        </>
      );
    },
  ),
  { displayName: 'Progress' },
);
