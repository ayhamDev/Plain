import {
  type CartesianGridProps,
  CartesianGrid,
  type XAxisProps,
  XAxis,
  type YAxisProps,
  YAxis,
} from 'recharts';
import { type PlainStyleProps, useStyles, useDirection } from './style-context';
import { chartGrid, chartLabel } from './charts-internal';

export function ChartGrid({
  className,
  unstyled,
  ...props
}: CartesianGridProps & Omit<PlainStyleProps, 'tooltip'>) {
  const styles = useStyles();
  return (
    <CartesianGrid
      vertical={false}
      stroke={chartGrid}
      strokeOpacity={0.65}
      {...styles('chart.grid', '', className, unstyled)}
      {...props}
    />
  );
}

ChartGrid.displayName = 'ChartGrid';

export function ChartXAxis({
  className,
  unstyled,
  ...props
}: XAxisProps & Omit<PlainStyleProps, 'tooltip'>) {
  const styles = useStyles();
  const dir = useDirection();
  return (
    <XAxis
      tickLine={false}
      axisLine={false}
      tick={{ fill: chartLabel, fontSize: 12 }}
      tickMargin={8}
      minTickGap={24}
      reversed={dir === 'rtl'}
      {...styles('chart.x-axis', '', className, unstyled)}
      {...props}
    />
  );
}

ChartXAxis.displayName = 'ChartXAxis';

export function ChartYAxis({
  className,
  unstyled,
  ...props
}: YAxisProps & Omit<PlainStyleProps, 'tooltip'>) {
  const styles = useStyles();
  const dir = useDirection();
  return (
    <YAxis
      tickLine={false}
      axisLine={false}
      width={64}
      tick={{ fill: chartLabel, fontSize: 12 }}
      tickMargin={8}
      orientation={dir === 'rtl' ? 'right' : 'left'}
      {...styles('chart.y-axis', '', className, unstyled)}
      {...props}
    />
  );
}

ChartYAxis.displayName = 'ChartYAxis';
