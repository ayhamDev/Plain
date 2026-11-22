import { type CartesianChartProps, CartesianChart } from './cartesian-chart';
import * as React from 'react';
import { BarChart as RechartsBarChart } from 'recharts';
import { ChartBar } from './chart-bar';
import { seriesProps } from './charts-internal';

export type BarChartProps = CartesianChartProps;

export const BarChart = /* @__PURE__ */ React.forwardRef<HTMLElement, BarChartProps>(
  (props, ref) => (
    <CartesianChart
      kind="bar"
      Engine={RechartsBarChart}
      allProps={props}
      forwardedRef={ref}
      renderSeries={(item, index, options) => (
        <ChartBar
          key={item.dataKey}
          {...seriesProps(item, index, options.stacked)}
          {...item.barProps}
        />
      )}
    />
  ),
);

BarChart.displayName = 'BarChart';
