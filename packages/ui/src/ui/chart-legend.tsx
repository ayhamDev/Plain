import { type LegendProps, Legend } from 'recharts';
import * as React from 'react';
import { ChartContext, chartLabel } from './charts-internal';

export function ChartLegend({ formatter, wrapperStyle, labelStyle, ...props }: LegendProps) {
  const { config } = React.useContext(ChartContext);
  return (
    <Legend
      iconType="circle"
      iconSize={8}
      {...props}
      wrapperStyle={{ fontSize: 12, color: chartLabel, paddingTop: 12, ...wrapperStyle }}
      labelStyle={{ color: chartLabel, ...labelStyle }}
      formatter={
        formatter ??
        ((value, entry) =>
          config[String(entry.dataKey)]?.label ?? config[String(value)]?.label ?? value)
      }
    />
  );
}

ChartLegend.displayName = 'ChartLegend';
