import { type ChartProps, type ChartDatum, Chart } from './chart-base';
import { type LegendProps, PieChart as RechartsPieChart, type PieProps, Cell } from 'recharts';
import { type ChartTooltipProps, ChartTooltip } from './chart-tooltip';
import * as React from 'react';
import { useTranslation } from './i18n';
import { formatValue, seriesColor } from './charts-internal';
import { ChartPie } from './chart-pie';
import { ChartLegend } from './chart-legend';

export interface DonutChartProps extends Omit<ChartProps, 'children' | 'data' | 'tooltip'> {
  data: readonly ChartDatum[];
  nameKey?: string;
  valueKey?: string;
  innerRadius?: number | string;
  outerRadius?: number | string;
  legend?: boolean | LegendProps;
  tooltip?: boolean | ChartTooltipProps;
  valueFormatter?: (value: number) => string;
  chartProps?: Omit<
    React.ComponentProps<typeof RechartsPieChart>,
    'data' | 'children' | 'width' | 'height' | 'responsive'
  >;
  pieProps?: Omit<
    PieProps<ChartDatum, number>,
    'data' | 'dataKey' | 'nameKey' | 'children' | 'innerRadius' | 'outerRadius'
  >;
  children?: React.ReactNode;
}

export const DonutChart = /* @__PURE__ */ React.forwardRef<HTMLElement, DonutChartProps>(
  (
    {
      data,
      nameKey = 'name',
      valueKey = 'value',
      innerRadius = '60%',
      outerRadius = '85%',
      legend = true,
      tooltip = true,
      valueFormatter,
      chartProps,
      pieProps,
      children,
      config = {},
      columns,
      ...props
    },
    ref,
  ) => {
    const language = useTranslation();
    const locale = props.locale ?? language.locale;
    const validData = data.filter(
      (row) =>
        typeof row[valueKey] === 'number' &&
        Number.isFinite(row[valueKey]) &&
        Number(row[valueKey]) > 0,
    );
    const tableColumns = columns ?? [
      { key: nameKey, label: config[nameKey]?.label ?? nameKey },
      {
        key: valueKey,
        label: config[valueKey]?.label ?? valueKey,
        format: (value: unknown) =>
          typeof value === 'number' && valueFormatter
            ? valueFormatter(value)
            : formatValue(value, locale),
      },
    ];
    return (
      <Chart
        loadingVariant={parseFloat(String(innerRadius)) > 0 ? 'donut' : 'pie'}
        {...props}
        ref={ref}
        data={data}
        config={config}
        columns={tableColumns}
        empty={props.empty ?? validData.length === 0}
      >
        <RechartsPieChart desc={props.description ?? props.label} {...chartProps}>
          <ChartPie
            data={validData}
            dataKey={valueKey}
            nameKey={nameKey}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            stroke="var(--ui-surface, #fff)"
            strokeWidth={2}
            legendType="circle"
            {...pieProps}
          >
            {validData.map((row, index) => (
              <Cell key={index} fill={seriesColor(config, row[nameKey], index)} />
            ))}
          </ChartPie>
          {tooltip && (
            <ChartTooltip
              formatter={
                valueFormatter
                  ? (value, name) => [
                      typeof value === 'number' ? valueFormatter(value) : value,
                      config[String(name)]?.label ?? name,
                    ]
                  : undefined
              }
              {...(typeof tooltip === 'object' ? tooltip : {})}
            />
          )}
          {legend && <ChartLegend {...(typeof legend === 'object' ? legend : {})} />}
          {children}
        </RechartsPieChart>
      </Chart>
    );
  },
);

DonutChart.displayName = 'DonutChart';
