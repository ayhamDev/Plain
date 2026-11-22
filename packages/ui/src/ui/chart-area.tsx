import { type AreaProps, Area } from 'recharts';
import { type ChartDatum } from './chart-base';
import { useSeries } from './charts-internal';
import * as React from 'react';

export function ChartArea({
  seriesIndex,
  gradient = true,
  ...props
}: AreaProps<ChartDatum, number> & { seriesIndex?: number; gradient?: boolean }) {
  const { color, animate } = useSeries(props.dataKey, seriesIndex);
  const gradientId = `ui-area-${React.useId().replace(/:/g, '')}`;
  const fillColor = props.fill ?? color;
  return (
    <>
      {gradient && !props.fill && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity={0.38} />
            <stop offset="100%" stopColor={fillColor} stopOpacity={0.03} />
          </linearGradient>
        </defs>
      )}
      <Area
        type="monotone"
        stroke={color}
        fill={gradient && !props.fill ? `url(#${gradientId})` : fillColor}
        fillOpacity={gradient && !props.fill ? 1 : 0.18}
        strokeWidth={2}
        dot={false}
        {...props}
        isAnimationActive={animate ? (props.isAnimationActive ?? 'auto') : false}
      />
    </>
  );
}

ChartArea.displayName = 'ChartArea';
