import {
  type ChartProps,
  type ChartDatum,
  type ChartSeries,
  type ChartConfig,
  Chart,
} from './chart-base';
import {
  type CartesianGridProps,
  type LegendProps,
  type XAxisProps,
  type YAxisProps,
  type AreaProps,
} from 'recharts';
import { type ChartTooltipProps, ChartTooltip } from './chart-tooltip';
import { type EngineChartProps, formatValue } from './charts-internal';
import type * as React from 'react';
import { useTranslation } from './i18n';
import { ChartGrid, ChartXAxis, ChartYAxis } from './chart-axes';
import { ChartLegend } from './chart-legend';

export interface CartesianChartProps extends Omit<ChartProps, 'children' | 'data' | 'tooltip'> {
  data: readonly ChartDatum[];
  /** Categorical axis key. Defaults to name. */
  index?: string;
  series?: readonly ChartSeries[];
  grid?: boolean | CartesianGridProps;
  legend?: boolean | LegendProps;
  tooltip?: boolean | ChartTooltipProps;
  xAxis?: boolean | XAxisProps;
  yAxis?: boolean | YAxisProps;
  /** Stack visible series; individual stackId values still take precedence. */
  stacked?: boolean;
  /** Interpolation for area and line charts. */
  curve?: AreaProps<ChartDatum, number>['type'];
  valueFormatter?: (value: number) => string;
  chartProps?: EngineChartProps;
  children?: React.ReactNode;
}

export function CartesianChart({
  Engine,
  kind,
  renderSeries,
  forwardedRef,
  allProps,
}: {
  Engine: React.ElementType;
  kind: 'area' | 'bar' | 'line' | 'composed';
  renderSeries: (
    item: ChartSeries,
    index: number,
    options: { stacked: boolean; curve: NonNullable<CartesianChartProps['curve']> },
  ) => React.ReactNode;
  forwardedRef: React.ForwardedRef<HTMLElement>;
  allProps: CartesianChartProps;
}) {
  const {
    data,
    index = 'name',
    series,
    grid = true,
    legend = true,
    tooltip = true,
    xAxis = true,
    yAxis = true,
    stacked = false,
    curve = 'monotone',
    valueFormatter,
    chartProps,
    children,
    config,
    columns,
    ...props
  } = allProps;
  const language = useTranslation();
  const locale = props.locale ?? language.locale;
  const entries: readonly ChartSeries[] =
    series ??
    [...new Set(data.flatMap((row) => Object.keys(row)))]
      .filter((key) => key !== index && data.some((row) => typeof row[key] === 'number'))
      .map((dataKey) => ({ dataKey }));
  const mergedConfig: ChartConfig = { ...config };
  for (const item of entries) {
    mergedConfig[item.dataKey] = {
      ...config?.[item.dataKey],
      ...('label' in item && item.label ? { label: item.label } : {}),
      ...('color' in item && item.color ? { color: item.color } : {}),
    };
  }
  const vertical = chartProps?.layout === 'vertical';
  const tableColumns = columns ?? [
    { key: index, label: config?.[index]?.label ?? index },
    ...entries.map((item) => ({
      key: item.dataKey,
      label: mergedConfig[item.dataKey]?.label ?? item.dataKey,
      format: (value: unknown) =>
        typeof value === 'number' && valueFormatter
          ? valueFormatter(value)
          : formatValue(value, locale),
    })),
  ];
  return (
    <Chart
      loadingVariant={kind}
      {...props}
      ref={forwardedRef}
      data={data}
      config={mergedConfig}
      columns={tableColumns}
    >
      <Engine
        accessibilityLayer
        data={data}
        margin={{ top: 12, right: 16, bottom: 4, left: 0 }}
        desc={props.description ?? props.label}
        {...chartProps}
      >
        {grid && (
          <ChartGrid
            vertical={vertical}
            horizontal={!vertical}
            {...(typeof grid === 'object' ? grid : {})}
          />
        )}
        {xAxis && (
          <ChartXAxis
            dataKey={vertical ? undefined : index}
            type={vertical ? 'number' : 'category'}
            tickFormatter={vertical ? valueFormatter : undefined}
            {...(typeof xAxis === 'object' ? xAxis : {})}
          />
        )}
        {yAxis && (
          <ChartYAxis
            dataKey={vertical ? index : undefined}
            type={vertical ? 'category' : 'number'}
            tickFormatter={vertical ? undefined : valueFormatter}
            {...(typeof yAxis === 'object' ? yAxis : {})}
          />
        )}
        {tooltip && (
          <ChartTooltip
            formatter={
              valueFormatter
                ? (value, name) => [
                    typeof value === 'number' ? valueFormatter(value) : value,
                    mergedConfig[String(name)]?.label ?? name,
                  ]
                : undefined
            }
            {...(typeof tooltip === 'object' ? tooltip : {})}
          />
        )}
        {legend && <ChartLegend {...(typeof legend === 'object' ? legend : {})} />}
        {entries.map((item, index) => renderSeries(item, index, { stacked, curve }))}
        {children}
      </Engine>
    </Chart>
  );
}
