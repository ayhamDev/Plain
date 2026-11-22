import { type ChartProps, type ChartDatum, type ChartSeries, Chart } from './chart-base';
import * as React from 'react';
import {
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  type LegendProps,
  RadarChart as RechartsRadarChart,
  Radar,
} from 'recharts';
import { type ChartTooltipProps, ChartTooltip } from './chart-tooltip';
import { useMotionSettings } from './motion-policy';
import { chartGrid, chartLabel, seriesColor } from './charts-internal';
import { ChartLegend } from './chart-legend';

export interface RadarChartProps extends Omit<ChartProps, 'children' | 'data' | 'tooltip'> {
  data: readonly ChartDatum[];
  index?: string;
  series: readonly ChartSeries[];
  grid?: boolean | React.ComponentProps<typeof PolarGrid>;
  angleAxis?: React.ComponentProps<typeof PolarAngleAxis>;
  radiusAxis?: boolean | React.ComponentProps<typeof PolarRadiusAxis>;
  legend?: boolean | LegendProps;
  tooltip?: boolean | ChartTooltipProps;
  chartProps?: React.ComponentProps<typeof RechartsRadarChart>;
  radarProps?: Partial<React.ComponentProps<typeof Radar>>;
}

export const RadarChart = /* @__PURE__ */ React.forwardRef<HTMLElement, RadarChartProps>(
  (
    {
      data,
      index = 'name',
      series,
      grid = true,
      angleAxis,
      radiusAxis = true,
      legend = true,
      tooltip = true,
      chartProps,
      radarProps,
      config = {},
      ...props
    },
    ref,
  ) => {
    const motion = useMotionSettings();
    const merged = { ...config };
    for (const s of series)
      merged[s.dataKey] = {
        ...config[s.dataKey],
        label: s.label ?? config[s.dataKey]?.label ?? s.dataKey,
        ...(s.color ? { color: s.color } : {}),
      };
    return (
      <Chart loadingVariant="radar" {...props} ref={ref} data={data} config={merged}>
        <RechartsRadarChart accessibilityLayer data={data} {...chartProps}>
          {grid && <PolarGrid stroke={chartGrid} {...(typeof grid === 'object' ? grid : {})} />}
          <PolarAngleAxis
            dataKey={index}
            tick={{ fill: chartLabel, fontSize: 12 }}
            {...angleAxis}
          />
          {radiusAxis && (
            <PolarRadiusAxis
              tick={{ fill: chartLabel, fontSize: 11 }}
              axisLine={false}
              {...(typeof radiusAxis === 'object' ? radiusAxis : {})}
            />
          )}
          {series.map((s, i) => (
            <Radar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.label ?? s.dataKey}
              stroke={seriesColor(merged, s.dataKey, i)}
              fill={seriesColor(merged, s.dataKey, i)}
              fillOpacity={0.15}
              {...radarProps}
              isAnimationActive={motion.enabled && props.animate !== false}
            />
          ))}
          {tooltip && <ChartTooltip {...(typeof tooltip === 'object' ? tooltip : {})} />}
          {legend && <ChartLegend {...(typeof legend === 'object' ? legend : {})} />}
        </RechartsRadarChart>
      </Chart>
    );
  },
);

RadarChart.displayName = 'RadarChart';
