import { type CartesianChartProps, CartesianChart } from './cartesian-chart';
import * as React from 'react';
import { AreaChart as RechartsAreaChart } from 'recharts';
import { ChartArea } from './chart-area';
import { seriesProps } from './charts-internal';

export type AreaChartProps = CartesianChartProps;

export const AreaChart = /* @__PURE__ */ React.forwardRef<HTMLElement, AreaChartProps>(
  (props, ref) => (
    <CartesianChart
      kind="area"
      Engine={RechartsAreaChart}
      allProps={props}
      forwardedRef={ref}
      renderSeries={(item, index, options) => (
        <ChartArea
          key={item.dataKey}
          {...seriesProps(item, index, options.stacked)}
          type={options.curve}
          {...item.areaProps}
        />
      )}
    />
  ),
);

AreaChart.displayName = 'AreaChart';
