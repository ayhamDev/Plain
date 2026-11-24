import * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';
import { useMotionSettings } from './motion-policy';
import { useTranslation } from './i18n';
import { finiteRange } from './progress-geometry';
import { loadingShapePaths } from './loading-shapes';

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
const times = Array.from({ length: 8 }, (_, i) => i / 7).join(';');
const splines = Array.from({ length: 7 }, () => '0.2 0 0 1').join(';');

export interface LoadingIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>, PlainStyleProps {
  variant?: 'default' | 'contained';
  size?: 'sm' | 'md' | 'lg' | number;
  label?: string;
  playing?: boolean;
  /** Seven-shape cycle duration in milliseconds. */
  duration?: number;
  startingShape?: number;
}

export const LoadingIndicator = /* @__PURE__ */ React.forwardRef<
  HTMLDivElement,
  LoadingIndicatorProps
>(
  (
    {
      variant = 'default',
      size = 'md',
      label,
      playing = true,
      duration = 4667,
      startingShape = 0,
      className,
      style,
      unstyled,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const motion = useMotionSettings();
    const mounted = React.useSyncExternalStore(subscribe, clientReady, serverReady);
    const animated = mounted && motion.enabled;
    const svg = React.useRef<SVGSVGElement>(null);
    const first = Math.round(finiteRange(startingShape, 0, 0, 6));
    const paths = Array.from({ length: 8 }, (_, i) => loadingShapePaths[(i + first) % 7]).join(';');
    const diameter =
      typeof size === 'number' ? finiteRange(size, 48, 16, 512) : { sm: 32, md: 48, lg: 64 }[size];
    const cycle = `${finiteRange(duration, 4667, 700, 60000)}ms`;
    React.useEffect(() => {
      if (playing) svg.current?.unpauseAnimations?.();
      else svg.current?.pauseAnimations?.();
    }, [playing, animated]);
    return styles.tooltip(
      <div
        ref={ref}
        role="status"
        data-variant={variant}
        data-playing={animated && playing}
        {...styles('loading-indicator.root', 'ui-loading-indicator', className, unstyled)}
        {...props}
        style={{ width: diameter, height: diameter, ...style }}
      >
        <svg
          ref={svg}
          viewBox="0 0 100 100"
          aria-hidden="true"
          focusable="false"
          {...styles('loading-indicator.svg', 'ui-loading-indicator-svg', undefined, unstyled)}
        >
          <g>
            {animated && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 50"
                to="1080 50 50"
                dur={cycle}
                repeatCount="indefinite"
              />
            )}
            <path
              d={loadingShapePaths[first]}
              fill="currentColor"
              {...styles(
                'loading-indicator.shape',
                'ui-loading-indicator-shape',
                undefined,
                unstyled,
              )}
            >
              {animated && (
                <animate
                  attributeName="d"
                  values={paths}
                  keyTimes={times}
                  keySplines={splines}
                  calcMode="spline"
                  dur={cycle}
                  repeatCount="indefinite"
                />
              )}
            </path>
          </g>
        </svg>
        <span {...styles('loading-indicator.label', 'sr-only', undefined, unstyled)}>
          {label ?? t('common.loading')}
        </span>
      </div>,
      unstyled,
    );
  },
);
LoadingIndicator.displayName = 'LoadingIndicator';
