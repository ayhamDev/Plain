import { type BarProps, Bar } from 'recharts';
import { useSeries } from './charts-internal';

export function ChartBar({ seriesIndex, ...props }: BarProps & { seriesIndex?: number }) {
  const { color, animate } = useSeries(props.dataKey, seriesIndex);
  return (
    <Bar
      fill={color}
      maxBarSize={32}
      radius={[3, 3, 0, 0]}
      {...props}
      isAnimationActive={animate ? (props.isAnimationActive ?? 'auto') : false}
    />
  );
}

ChartBar.displayName = 'ChartBar';
