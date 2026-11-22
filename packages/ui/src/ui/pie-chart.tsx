import * as React from 'react';
import { type DonutChartProps, DonutChart } from './donut-chart';

export const PieChart = /* @__PURE__ */ React.forwardRef<HTMLElement, DonutChartProps>(
  (props, ref) => <DonutChart innerRadius={0} ref={ref} {...props} />,
);

PieChart.displayName = 'PieChart';
