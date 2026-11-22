import { type LineProps, Line } from 'recharts';
import { useSeries } from './charts-internal';

export function ChartLine({ seriesIndex, ...props }: LineProps & { seriesIndex?: number }) {
  const { color, animate } = useSeries(props.dataKey, seriesIndex);
  return (
    <Line
      type="monotone"
      stroke={color}
      strokeWidth={2}
      dot={false}
      activeDot={{ r: 4 }}
      {...props}
      isAnimationActive={animate ? (props.isAnimationActive ?? 'auto') : false}
    />
  );
}

ChartLine.displayName = 'ChartLine';
