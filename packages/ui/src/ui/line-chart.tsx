import { type CartesianChartProps, CartesianChart } from './cartesian-chart';
import * as React from 'react';
import { LineChart as RechartsLineChart } from 'recharts';
import { ChartLine } from './chart-line';
import { seriesProps } from './charts-internal';

export type LineChartProps = CartesianChartProps;

export const LineChart = /* @__PURE__ */ React.forwardRef<HTMLElement, LineChartProps>(
  (props, ref) => (
    <CartesianChart
      kind="line"
      Engine={RechartsLineChart}
      allProps={props}
      forwardedRef={ref}
      renderSeries={(item, index, options) => (
        <ChartLine
          key={item.dataKey}
          {...seriesProps(item, index, options.stacked)}
          type={options.curve}
          {...item.lineProps}
        />
      )}
    />
  ),
);

LineChart.displayName = 'LineChart';
