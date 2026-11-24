import * as React from 'react';
import { useStyles } from './style-context';
import { linearWave } from './progress-geometry';

export function ProgressWave({
  ratio,
  thickness,
  amplitude,
  wavelength,
  gap,
  unstyled,
  animated,
}: {
  ratio: number | null;
  thickness: number;
  amplitude: number;
  wavelength: number;
  gap: number;
  unstyled?: boolean;
  animated: boolean;
}) {
  const styles = useStyles();
  const svg = React.useRef<SVGSVGElement>(null);
  const [width, setWidth] = React.useState(320);
  React.useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const update = () => {
      const next = Math.max(1, element.clientWidth);
      setWidth((current) => (Math.abs(next - current) < 0.5 ? current : next));
    };
    update();
    const observer = new ResizeObserver(update);
    // Observe the HTML layout box, and measure in logical pixels before zoom/transforms.
    observer.observe(element.parentElement ?? element);
    return () => observer.disconnect();
  }, []);
  const height = thickness + amplitude * 2 + 2;
  const mid = height / 2;
  const activeWidth = (ratio ?? 0.35) * width;
  const valueAmplitude = amplitude * (ratio !== null && ratio > 0.8 ? (1 - ratio) / 0.2 : 1);
  const path = linearWave(
    thickness / 2,
    Math.max(thickness / 2, activeWidth - thickness / 2),
    mid,
    valueAmplitude,
    wavelength,
  );
  const tailStart = activeWidth + gap + thickness / 2;
  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      data-animated={animated || undefined}
      {...styles('progress.wave', 'ui-progress-wave', undefined, unstyled)}
    >
      <g
        {...styles(
          'progress.wave-motion',
          ratio === null ? 'ui-progress-wave-travel' : '',
          undefined,
          unstyled,
        )}
      >
        {ratio === null && (
          <path
            d={`M${-width * 2} ${mid}H${-gap - thickness / 2}`}
            {...styles('progress.track', 'ui-progress-wave-track', undefined, unstyled)}
            strokeWidth={thickness}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {(ratio === null || ratio < 1) && (
          <path
            d={`M${ratio === 0 ? thickness / 2 : tailStart} ${mid}H${ratio === null ? width * 3 : Math.max(thickness / 2, width - thickness / 2)}`}
            visibility={
              ratio !== null && tailStart >= width - thickness / 2 && ratio !== 0
                ? 'hidden'
                : undefined
            }
            {...styles('progress.track', 'ui-progress-wave-track', undefined, unstyled)}
            strokeWidth={thickness}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {ratio !== 0 && (
          <path
            d={path}
            strokeWidth={thickness}
            vectorEffect="non-scaling-stroke"
            {...styles('progress.indicator', 'ui-progress-wave-value', undefined, unstyled)}
          />
        )}
      </g>
    </svg>
  );
}
