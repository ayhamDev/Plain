import * as React from 'react';
import { Progress as ProgressPrimitive } from 'radix-ui';
import { type PlainStyleProps, useStyles, useDirection } from './style-context';
import { useTranslation, numberFormatter } from './i18n';
import { useMotionSettings } from './motion-policy';
import { circularWave, finiteRange, progressValue } from './progress-geometry';

export interface CircularProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, PlainStyleProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'standard' | 'wavy';
  thickness?: number;
  gap?: number;
  amplitude?: number;
  /** Number of complete waves around the ring. */
  frequency?: number;
  indeterminate?: boolean;
  formatValue?: (value: number, max: number) => string;
}

export const CircularProgress = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  CircularProgressProps
>(
  (
    {
      value,
      max = 100,
      size = 'md',
      variant = 'standard',
      thickness = 4,
      gap = 4,
      amplitude = 2,
      frequency = 10,
      indeterminate = false,
      formatValue,
      children,
      unstyled,
      className,
      style,
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
    const safeValue = progressValue(indeterminate ? null : value, safeMax);
    const ratio = safeValue === null ? 0.25 : safeValue / safeMax;
    const diameter =
      typeof size === 'number'
        ? finiteRange(size, 48, 16, 512)
        : { sm: 32, md: 48, lg: 64, xl: 96 }[size];
    const stroke = finiteRange(thickness, 4, 1, diameter / 4);
    const wave = variant === 'wavy' ? finiteRange(amplitude, 2, 0, diameter / 8) : 0;
    const radius = Math.max(1, diameter / 2 - wave - stroke / 2 - 1);
    const circumference = Math.PI * 2 * radius;
    const separation = ((finiteRange(gap, 4, 0, 32) + stroke) / circumference) * 100;
    const trackLength = ratio === 0 ? 100 : Math.max(0, 100 - ratio * 100 - separation * 2);
    const center = diameter / 2;
    const motion = useMotionSettings(safeValue === null);
    const percentage = numberFormatter(locale, { style: 'percent', maximumFractionDigits: 1 });
    return styles.tooltip(
      <ProgressPrimitive.Root
        ref={ref}
        value={safeValue}
        max={safeMax}
        dir={direction}
        getValueLabel={(amount, maximum) =>
          formatValue?.(amount, maximum) ?? percentage.format(amount / maximum)
        }
        data-variant={variant}
        data-animated={safeValue === null ? motion.enabled : undefined}
        {...styles('circular-progress.root', 'ui-circular-progress', className, unstyled)}
        {...props}
        style={{ width: diameter, height: diameter, ...style }}
      >
        <svg
          viewBox={`0 0 ${diameter} ${diameter}`}
          aria-hidden="true"
          focusable="false"
          {...styles('circular-progress.svg', 'ui-circular-progress-svg', undefined, unstyled)}
        >
          <g
            {...styles(
              'circular-progress.motion',
              safeValue === null ? 'ui-circular-progress-rotate' : '',
              undefined,
              unstyled,
            )}
          >
            <circle
              cx={center}
              cy={center}
              r={radius}
              pathLength={100}
              fill="none"
              strokeWidth={stroke}
              strokeDasharray={`${trackLength} 100`}
              strokeDashoffset={ratio === 0 ? 0 : -(ratio * 100 + separation)}
              transform={`rotate(-90 ${center} ${center})`}
              visibility={trackLength === 0 ? 'hidden' : undefined}
              {...styles(
                'circular-progress.track',
                'ui-circular-progress-track',
                undefined,
                unstyled,
              )}
            />
            {variant === 'wavy' ? (
              <path
                d={circularWave(
                  center,
                  radius,
                  wave * (safeValue !== null && ratio > 0.8 ? (1 - ratio) / 0.2 : 1),
                  Math.round(finiteRange(frequency, 10, 3, 24)),
                )}
                pathLength={100}
                fill="none"
                strokeWidth={stroke}
                strokeDasharray={`${ratio * 100} 100`}
                visibility={ratio === 0 ? 'hidden' : undefined}
                {...styles(
                  'circular-progress.indicator',
                  'ui-circular-progress-value',
                  undefined,
                  unstyled,
                )}
              />
            ) : (
              <circle
                cx={center}
                cy={center}
                r={radius}
                pathLength={100}
                fill="none"
                strokeWidth={stroke}
                strokeDasharray={`${ratio * 100} 100`}
                transform={`rotate(-90 ${center} ${center})`}
                visibility={ratio === 0 ? 'hidden' : undefined}
                {...styles(
                  'circular-progress.indicator',
                  'ui-circular-progress-value',
                  undefined,
                  unstyled,
                )}
              />
            )}
          </g>
        </svg>
        {children != null && (
          <span
            {...styles(
              'circular-progress.content',
              'ui-circular-progress-content',
              undefined,
              unstyled,
            )}
          >
            {children}
          </span>
        )}
      </ProgressPrimitive.Root>,
      unstyled,
    );
  },
);
CircularProgress.displayName = 'CircularProgress';
