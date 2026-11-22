import { type PieProps, Pie } from 'recharts';
import { type ChartDatum } from './chart-base';
import { useSeries } from './charts-internal';

export function ChartPie({ ...props }: PieProps<ChartDatum, number>) {
  const { animate } = useSeries(props.dataKey);
  return (
    <Pie {...props} isAnimationActive={animate ? (props.isAnimationActive ?? 'auto') : false} />
  );
}

ChartPie.displayName = 'ChartPie';
