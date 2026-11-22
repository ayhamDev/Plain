import * as React from 'react';
import { type CartesianChartProps, CartesianChart } from './cartesian-chart';
import { ComposedChart as RechartsComposedChart } from 'recharts';
import { ChartBar } from './chart-bar';
import { seriesProps } from './charts-internal';
import { ChartArea } from './chart-area';
import { ChartLine } from './chart-line';

export const ComposedChart = /* @__PURE__ */ React.forwardRef<HTMLElement, CartesianChartProps>(
  (props, ref) => (
    <CartesianChart
      kind="composed"
      Engine={RechartsComposedChart}
      allProps={props}
      forwardedRef={ref}
      renderSeries={(item, index, options) =>
        item.type === 'bar' ? (
          <ChartBar
            key={item.dataKey}
            {...seriesProps(item, index, options.stacked)}
            {...item.barProps}
          />
        ) : item.type === 'area' ? (
          <ChartArea
            key={item.dataKey}
            {...seriesProps(item, index, options.stacked)}
            type={options.curve}
            {...item.areaProps}
          />
        ) : (
          <ChartLine
            key={item.dataKey}
            {...seriesProps(item, index, options.stacked)}
            type={options.curve}
            {...item.lineProps}
          />
        )
      }
    />
  ),
);

ComposedChart.displayName = 'ComposedChart';
