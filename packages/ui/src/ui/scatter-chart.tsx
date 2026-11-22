import { type ChartProps, type ChartDatum, Chart } from './chart-base';
import {
  type XAxisProps,
  type YAxisProps,
  type CartesianGridProps,
  Scatter,
  ScatterChart as RechartsScatterChart,
} from 'recharts';
import { type ChartTooltipProps, ChartTooltip } from './chart-tooltip';
import * as React from 'react';
import { useMotionSettings } from './motion-policy';
import { ChartGrid, ChartXAxis, ChartYAxis } from './chart-axes';
import { chartPalette } from './chart-palette';

export interface ScatterChartProps extends Omit<ChartProps, 'children' | 'data' | 'tooltip'> {
  data: readonly ChartDatum[];
  xKey: string;
  yKey: string;
  xAxis?: XAxisProps;
  yAxis?: YAxisProps;
  grid?: boolean | CartesianGridProps;
  tooltip?: boolean | ChartTooltipProps;
  scatterProps?: Partial<React.ComponentProps<typeof Scatter>>;
  chartProps?: React.ComponentProps<typeof RechartsScatterChart>;
}

export const ScatterChart = /* @__PURE__ */ React.forwardRef<HTMLElement, ScatterChartProps>(
  (
    {
      data,
      xKey,
      yKey,
      xAxis,
      yAxis,
      grid = true,
      tooltip = true,
      scatterProps,
      chartProps,
      ...props
    },
    ref,
  ) => {
    const motion = useMotionSettings();
    return (
      <Chart loadingVariant="scatter" {...props} ref={ref} data={data}>
        <RechartsScatterChart accessibilityLayer {...chartProps}>
          {grid && <ChartGrid {...(typeof grid === 'object' ? grid : {})} />}
          <ChartXAxis type="number" dataKey={xKey} {...xAxis} />
          <ChartYAxis type="number" dataKey={yKey} {...yAxis} />
          <Scatter
            data={data}
            fill={chartPalette[0]}
            {...scatterProps}
            isAnimationActive={motion.enabled && props.animate !== false}
          />
          {tooltip && <ChartTooltip {...(typeof tooltip === 'object' ? tooltip : {})} />}
        </RechartsScatterChart>
      </Chart>
    );
  },
);

ScatterChart.displayName = 'ScatterChart';
