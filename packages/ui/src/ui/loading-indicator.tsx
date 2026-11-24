import * as React from 'react';
import { type PlainStyleProps, useStyles } from './style-context';
import { useMotionSettings } from './motion-policy';
import { useTranslation } from './i18n';
import { finiteRange } from './progress-geometry';
import { loadingShapePaths } from './loading-shapes';
import {
  loadingAnimation,
  loadingCycleDuration,
  loadingRotationDuration,
} from './loading-animation';

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

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
      duration = loadingCycleDuration,
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
    const animation = animated ? loadingAnimation(first) : undefined;
    const diameter =
      typeof size === 'number' ? finiteRange(size, 48, 16, 512) : { sm: 32, md: 48, lg: 64 }[size];
    const cycle = finiteRange(duration, loadingCycleDuration, 700, 60000);
    React.useEffect(() => {
      if (playing) svg.current?.unpauseAnimations?.();
      else svg.current?.pauseAnimations?.();
    }, [playing, animated, first, cycle]);
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
          key={`${first}:${cycle}:${animated}`}
          ref={svg}
          viewBox="0 0 48 48"
          aria-hidden="true"
          focusable="false"
          {...styles('loading-indicator.svg', 'ui-loading-indicator-svg', undefined, unstyled)}
        >
          <g transform="translate(24 24) scale(1.065) translate(-24 -24)">
            <g data-loading-rotation="global">
              {animated && (
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 24 24"
                  to="360 24 24"
                  dur={`${(loadingRotationDuration * cycle) / loadingCycleDuration}ms`}
                  repeatCount="indefinite"
                />
              )}
              <g data-loading-rotation="turn">
                {animation && (
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values={animation.turn.values}
                    keyTimes={animation.turn.times}
                    keySplines={animation.turn.splines}
                    calcMode="spline"
                    dur={`${cycle * 4}ms`}
                    repeatCount="indefinite"
                  />
                )}
                {!animation ? (
                  <path
                    d={loadingShapePaths[first]}
                    fill="currentColor"
                    {...styles(
                      'loading-indicator.shape',
                      'ui-loading-indicator-shape',
                      undefined,
                      unstyled,
                    )}
                  />
                ) : (
                  animation.stages.map((stage) => (
                    <React.Fragment key={stage.source}>
                      <path
                        d={stage.path}
                        fill="currentColor"
                        visibility="hidden"
                        data-loading-contour={stage.source}
                        data-loading-phase="morph"
                        {...styles(
                          'loading-indicator.shape',
                          'ui-loading-indicator-shape',
                          undefined,
                          unstyled,
                        )}
                      >
                        <animate
                          attributeName="d"
                          values={stage.values}
                          keyTimes={stage.times}
                          keySplines={stage.splines}
                          calcMode="spline"
                          dur={`${cycle}ms`}
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="visibility"
                          values={stage.morphVisibility.values}
                          keyTimes={stage.morphVisibility.times}
                          calcMode="discrete"
                          dur={`${cycle}ms`}
                          repeatCount="indefinite"
                        />
                      </path>
                      <path
                        d={stage.rest}
                        fill="currentColor"
                        visibility="hidden"
                        data-loading-contour={stage.target}
                        data-loading-phase="rest"
                        {...styles(
                          'loading-indicator.shape',
                          'ui-loading-indicator-shape',
                          undefined,
                          unstyled,
                        )}
                      >
                        <animate
                          attributeName="visibility"
                          values={stage.restVisibility.values}
                          keyTimes={stage.restVisibility.times}
                          calcMode="discrete"
                          dur={`${cycle}ms`}
                          repeatCount="indefinite"
                        />
                      </path>
                    </React.Fragment>
                  ))
                )}
              </g>
            </g>
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
