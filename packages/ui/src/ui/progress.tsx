import * as React from 'react';
import { Progress as ProgressPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles, useDirection } from './style-context';
import { useTranslation, numberFormatter } from './i18n';
import { cn } from './utils';
import { useMotionSettings } from './motion-policy';
import { finiteRange } from './progress-geometry';
import { ProgressWave } from './progress-wave';

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, PlainStyleProps {
  size?: 'sm' | 'md' | 'lg';
  segments?: readonly ProgressSegment[];
  showLegend?: boolean;
  formatValue?: (value: number, max: number) => string;
  /** Flat or smooth waves with a wavelength measured in CSS pixels. */
  variant?: 'standard' | 'wavy';
  /** Visible separation between the active value and remaining track, in pixels. */
  gap?: number;
  /** Wave stroke thickness in pixels. Defaults to the selected size. */
  thickness?: number;
  amplitude?: number;
  wavelength?: number;
  indeterminate?: boolean;
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
        variant = 'standard',
        gap = 4,
        thickness,
        amplitude,
        wavelength = 24,
        indeterminate = false,
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
      const resolvedValue =
        total === Infinity ? safeMax : (total ?? (indeterminate ? null : value));
      const safeValue =
        resolvedValue == null || !Number.isFinite(resolvedValue)
          ? null
          : Math.max(0, Math.min(safeMax, resolvedValue));
      const formatter = numberFormatter(locale, { style: 'percent', maximumFractionDigits: 1 });
      const formatted = (amount: number) =>
        formatValue?.(amount, safeMax) ?? formatter.format(amount / safeMax);
      const motion = useMotionSettings(safeValue === null);
      const safeGap = finiteRange(gap, 4, 0, 32);
      const stroke = finiteRange(thickness ?? { sm: 2, md: 4, lg: 6 }[size], 4, 1, 16);
      const wave = finiteRange(amplitude ?? { sm: 2, md: 3, lg: 4 }[size], 3, 0, 16);
      const ratio = safeValue === null ? null : safeValue / safeMax;
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
              getValueLabel={formatted}
              {...(parts
                ? {
                    'aria-valuetext': parts
                      .map((part) => `${part.label}: ${formatted(part.value)}`)
                      .join('; '),
                  }
                : {})}
              data-segmented={!!parts || undefined}
              data-variant={variant}
              data-animated={safeValue === null ? motion.enabled : undefined}
              {...styles(
                'progress.root',
                cn(
                  'ui-progress relative w-full overflow-hidden rounded-full',
                  parts && 'bg-muted',
                  { sm: 'h-1', md: 'h-2', lg: 'h-3' }[size],
                ),
                className,
                unstyled,
              )}
              {...props}
              style={{
                ...(variant === 'wavy' && !parts ? { height: stroke + wave * 2 + 2 } : {}),
                ...props.style,
              }}
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
              ) : variant === 'wavy' ? (
                <ProgressWave
                  ratio={ratio}
                  thickness={stroke}
                  amplitude={wave}
                  wavelength={finiteRange(wavelength, 24, 8, 128)}
                  gap={safeGap}
                  unstyled={unstyled}
                  animated={motion.enabled}
                />
              ) : (
                <>
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
                      marginInlineStart: safeValue === null ? undefined : 0,
                    }}
                  >
                    {ratio === null && (
                      <>
                        <span
                          aria-hidden="true"
                          {...styles(
                            'progress.track-before',
                            'ui-progress-moving-track ui-progress-track-before',
                            undefined,
                            unstyled,
                          )}
                          style={{ insetInlineEnd: `calc(100% + ${safeGap}px)` }}
                        />
                        <span
                          aria-hidden="true"
                          {...styles(
                            'progress.track-after',
                            'ui-progress-moving-track ui-progress-track-after',
                            undefined,
                            unstyled,
                          )}
                          style={{ insetInlineStart: `calc(100% + ${safeGap}px)` }}
                        />
                      </>
                    )}
                  </ProgressPrimitive.Indicator>
                  {ratio !== null && ratio < 1 && (
                    <span
                      aria-hidden="true"
                      {...styles('progress.track', 'ui-progress-track', undefined, unstyled)}
                      style={{
                        insetInlineStart: ratio === 0 ? 0 : `calc(${ratio * 100}% + ${safeGap}px)`,
                      }}
                    />
                  )}
                </>
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

/** Linear progress also retains Progress's segmented storage API. */
export const LinearProgress = Progress;
export type LinearProgressProps = ProgressProps;
