import * as React from 'react';
import { LoaderCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  RadarChart as RechartsRadarChart,
  ScatterChart as RechartsScatterChart,
  ComposedChart as RechartsComposedChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Scatter,
  Area,
  Bar,
  Line,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  type AreaProps,
  type BarProps,
  type LineProps,
  type PieProps,
  type CartesianGridProps,
  type XAxisProps,
  type YAxisProps,
  type TooltipProps,
  type TooltipValueType,
  type TooltipContentProps,
  type LegendProps,
} from 'recharts';
import {
  DirectionProvider,
  StyleProvider,
  useDirection,
  useStyles,
  type PlainStyleProps,
} from './styling';
import { dateFormatter, numberFormatter, useTranslation } from './i18n';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from './table';
import { useMotionSettings } from './motion-policy';

export type ChartDatum = Record<string, unknown>;
export type ChartConfig = Record<string, { label?: React.ReactNode; color?: string }>;
export interface ChartColumn {
  key: string;
  label?: React.ReactNode;
  accessor?: (row: ChartDatum) => unknown;
  format?: (value: unknown, row: ChartDatum) => React.ReactNode;
}
export interface ChartSeries {
  dataKey: string;
  label?: string;
  color?: string;
  stackId?: string;
  yAxisId?: string | number;
  strokeDasharray?: string;
  type?: 'area' | 'bar' | 'line';
  lineProps?: Partial<LineProps>;
  barProps?: Partial<BarProps>;
  areaProps?: Partial<AreaProps<ChartDatum, number>>;
}

/** Each palette color can be independently overridden with a semantic theme token. */
export const chartPalette = [
  'var(--ui-chart-1, var(--ui-accent, #267f60))',
  'var(--ui-chart-2, #3579c7)',
  'var(--ui-chart-3, #b35175)',
  'var(--ui-chart-4, #b08720)',
  'var(--ui-chart-5, #7b66b9)',
  'var(--ui-chart-6, #278c9b)',
  'var(--ui-chart-7, #c25a4b)',
  'var(--ui-chart-8, #697f36)',
] as const;
const chartLabel = 'var(--ui-chart-label, var(--ui-muted-foreground, #666b68))';
const chartGrid = 'var(--ui-chart-grid, var(--ui-border, #e5e7e6))';
const hiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
};

interface ChartContextValue {
  config: ChartConfig;
  locale?: string;
  animate: boolean;
}
const ChartContext = /* @__PURE__ */ React.createContext<ChartContextValue>({
  config: {},
  animate: true,
});

export interface ChartProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'children'>, PlainStyleProps {
  /** Pass data for an automatic screen-reader table, or provide an explicit description. */
  data?: readonly ChartDatum[];
  columns?: readonly ChartColumn[];
  config?: ChartConfig;
  label?: string;
  caption?: React.ReactNode;
  description?: string;
  locale?: string;
  /** A stable viewport height; defaults to 300px, even while empty or loading. */
  height?: React.CSSProperties['height'];
  loading?: boolean;
  empty?: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
  tableLabel?: string;
  /** False is appropriate when an explicit description conveys the chart's data. */
  dataTable?: 'sr-only' | 'visible' | false;
  animate?: boolean;
  children: React.ReactElement;
}

function formatValue(value: unknown, locale?: string): React.ReactNode {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '-';
    try {
      return numberFormatter(locale).format(value);
    } catch {
      return numberFormatter('en').format(value);
    }
  }
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) return '-';
    try {
      return dateFormatter(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(value);
    } catch {
      return dateFormatter('en', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
    }
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function getColumns(data: readonly ChartDatum[], config: ChartConfig): ChartColumn[] {
  return [...new Set(data.flatMap((row) => Object.keys(row)))].map((key) => ({
    key,
    label: config[key]?.label ?? key,
  }));
}

function seriesColor(config: ChartConfig, dataKey: unknown, index = 0) {
  const key = typeof dataKey === 'string' || typeof dataKey === 'number' ? String(dataKey) : '';
  const configuredIndex = Object.keys(config).indexOf(key);
  return (
    config[key]?.color ??
    chartPalette[(configuredIndex >= 0 ? configuredIndex : index) % chartPalette.length]
  );
}

function discoverSeries(children: React.ReactNode, config: ChartConfig): ChartConfig {
  const result: ChartConfig = {};
  const visit = (nodes: React.ReactNode) => {
    React.Children.forEach(nodes, (node) => {
      if (!React.isValidElement<{ dataKey?: unknown; children?: React.ReactNode }>(node)) return;
      if (node.type === ChartArea || node.type === ChartLine || node.type === ChartBar) {
        const key = node.props.dataKey;
        if (typeof key === 'string' || typeof key === 'number')
          result[String(key)] = config[String(key)] ?? {};
      }
      visit(node.props.children);
    });
  };
  visit(children);
  return { ...result, ...config };
}

/** Composes any Recharts chart, preserving native keyboard navigation and an accessible data alternative. */
export const Chart = /* @__PURE__ */ React.forwardRef<HTMLElement, ChartProps>(
  (
    {
      data,
      columns,
      config = {},
      label: labelProp,
      caption,
      description,
      locale: localeProp,
      height = 300,
      loading = false,
      empty = data?.length === 0,
      loadingLabel: loadingLabelProp,
      emptyLabel: emptyLabelProp,
      tableLabel,
      dataTable = 'sr-only',
      animate = true,
      children,
      className,
      style,
      dir,
      unstyled,
      'aria-describedby': describedBy,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const language = useTranslation();
    const label = labelProp ?? language.t('chart.label');
    const locale = localeProp ?? language.locale;
    const loadingLabel = loadingLabelProp ?? language.t('chart.loading');
    const emptyLabel = emptyLabelProp ?? language.t('chart.empty');
    const direction = useDirection(dir === 'ltr' || dir === 'rtl' ? dir : undefined);
    const motion = useMotionSettings();
    const descriptionId = React.useId();
    const tableId = React.useId();
    const resolvedConfig = React.useMemo(
      () => discoverSeries(children, config),
      [children, config],
    );
    const tableColumns = React.useMemo(
      () => columns ?? getColumns(data ?? [], config),
      [columns, data, config],
    );
    const hasTable =
      dataTable !== false && data !== undefined && tableColumns.length > 0 && !loading;
    const context = React.useMemo(
      () => ({ config: resolvedConfig, locale, animate: animate && motion.enabled }),
      [resolvedConfig, locale, animate, motion.enabled],
    );
    return (
      <StyleProvider unstyled={unstyled}>
        <DirectionProvider dir={direction}>
          <ChartContext.Provider value={context}>
            <figure
              {...styles('chart.root', 'ui-chart', className, unstyled)}
              {...props}
              ref={ref}
              style={{ minWidth: 0, margin: 0, ...style }}
              dir={direction}
              aria-label={props['aria-label'] ?? (props['aria-labelledby'] ? undefined : label)}
              aria-describedby={
                [
                  describedBy,
                  description ? descriptionId : undefined,
                  hasTable ? tableId : undefined,
                ]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              aria-busy={loading || undefined}
              data-state={loading ? 'loading' : empty ? 'empty' : 'ready'}
              data-motion={context.animate ? 'enabled' : 'disabled'}
            >
              {caption && (
                <figcaption {...styles('chart.caption', 'ui-chart-caption', undefined, unstyled)}>
                  {caption}
                </figcaption>
              )}
              {description && (
                <p id={descriptionId} style={hiddenStyle}>
                  {description}
                </p>
              )}
              <div
                {...styles('chart.viewport', 'ui-chart-viewport', undefined, unstyled)}
                style={{ width: '100%', minWidth: 0, height }}
              >
                {loading || empty ? (
                  <div
                    {...styles('chart.status', 'ui-chart-status', undefined, unstyled)}
                    role="status"
                    aria-live="polite"
                  >
                    {loading && <LoaderCircle size={18} aria-hidden="true" />}
                    <span>{loading ? loadingLabel : emptyLabel}</span>
                  </div>
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    initialDimension={{
                      width: 640,
                      height: typeof height === 'number' ? height : 300,
                    }}
                  >
                    {children}
                  </ResponsiveContainer>
                )}
              </div>
              {hasTable && (
                <div
                  {...styles('chart.data', 'ui-chart-data', undefined, unstyled)}
                  style={dataTable === 'sr-only' ? hiddenStyle : undefined}
                >
                  <Table
                    id={tableId}
                    {...styles('chart.table', 'ui-chart-table', undefined, unstyled)}
                  >
                    <TableCaption>{tableLabel ?? language.t('chart.data', { label })}</TableCaption>
                    <TableHeader>
                      <TableRow>
                        {tableColumns.map((column) => (
                          <TableHead key={column.key} scope="col">
                            {column.label ?? column.key}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data!.map((row, index) => (
                        <TableRow key={index}>
                          {tableColumns.map((column) => {
                            const value = column.accessor ? column.accessor(row) : row[column.key];
                            return (
                              <TableCell key={column.key}>
                                {column.format
                                  ? column.format(value, row)
                                  : formatValue(value, locale)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </figure>
          </ChartContext.Provider>
        </DirectionProvider>
      </StyleProvider>
    );
  },
);
Chart.displayName = 'Chart';

export function ChartGrid({ className, unstyled, ...props }: CartesianGridProps & PlainStyleProps) {
  const styles = useStyles();
  return (
    <CartesianGrid
      vertical={false}
      stroke={chartGrid}
      strokeOpacity={0.65}
      {...styles('chart.grid', '', className, unstyled)}
      {...props}
    />
  );
}

export function ChartXAxis({ className, unstyled, ...props }: XAxisProps & PlainStyleProps) {
  const styles = useStyles();
  const dir = useDirection();
  return (
    <XAxis
      tickLine={false}
      axisLine={false}
      tick={{ fill: chartLabel, fontSize: 12 }}
      tickMargin={8}
      minTickGap={24}
      reversed={dir === 'rtl'}
      {...styles('chart.x-axis', '', className, unstyled)}
      {...props}
    />
  );
}

export function ChartYAxis({ className, unstyled, ...props }: YAxisProps & PlainStyleProps) {
  const styles = useStyles();
  const dir = useDirection();
  return (
    <YAxis
      tickLine={false}
      axisLine={false}
      width={64}
      tick={{ fill: chartLabel, fontSize: 12 }}
      tickMargin={8}
      orientation={dir === 'rtl' ? 'right' : 'left'}
      {...styles('chart.y-axis', '', className, unstyled)}
      {...props}
    />
  );
}

export type ChartTooltipProps = TooltipProps<TooltipValueType, number | string>;

export type ChartTooltipContentProps = Partial<
  TooltipContentProps<TooltipValueType, number | string>
> & {
  indicator?: 'dot' | 'line' | 'dashed';
  hideLabel?: boolean;
};

/** Recharts supplies active point and keyboard state; this only renders its content. */
export function ChartTooltipContent({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  contentStyle,
  labelStyle,
  itemStyle,
  accessibilityLayer,
  indicator = 'dot',
  hideLabel = false,
}: ChartTooltipContentProps) {
  const { config, locale } = React.useContext(ChartContext);
  if (!active || !payload?.length) return null;
  const title = labelFormatter ? labelFormatter(label, payload) : formatValue(label, locale);
  return (
    <div
      className="ui-chart-tooltip"
      style={contentStyle}
      role={accessibilityLayer ? 'status' : undefined}
      aria-live={accessibilityLayer ? 'assertive' : undefined}
      aria-atomic={accessibilityLayer || undefined}
    >
      {!hideLabel && label != null && (
        <div className="ui-chart-tooltip-label" style={labelStyle}>
          {title}
        </div>
      )}
      <div className="ui-chart-tooltip-items">
        {payload
          .filter((entry) => entry.type !== 'none' && entry.value != null)
          .map((entry, index) => {
            const name =
              config[String(entry.dataKey)]?.label ??
              config[String(entry.name)]?.label ??
              entry.name;
            const formatted =
              formatter && entry.value !== undefined && entry.name !== undefined
                ? formatter(entry.value, entry.name, entry, index, payload)
                : undefined;
            const value = Array.isArray(formatted)
              ? formatted[0]
              : (formatted ?? formatValue(entry.value, locale));
            const text = Array.isArray(formatted) ? formatted[1] : name;
            return (
              <div
                className="ui-chart-tooltip-item"
                style={itemStyle}
                key={`${String(entry.dataKey ?? entry.name)}-${index}`}
              >
                <span
                  className="ui-chart-tooltip-indicator"
                  data-indicator={indicator}
                  aria-hidden="true"
                  style={
                    {
                      '--chart-indicator': entry.color ?? seriesColor(config, entry.dataKey, index),
                    } as React.CSSProperties
                  }
                />
                <span className="ui-chart-tooltip-name">{text}</span>
                <span className="ui-chart-tooltip-value">{value}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

/** Uses Recharts' native tooltip and live-region behavior, including keyboard focus. */
export function ChartTooltip({
  formatter,
  contentStyle,
  labelStyle,
  itemStyle,
  ...props
}: ChartTooltipProps) {
  const { config, locale, animate } = React.useContext(ChartContext);
  const motion = useMotionSettings();
  return (
    <Tooltip
      cursor={{ stroke: chartGrid, fill: 'var(--ui-muted, #f5f6f5)', fillOpacity: 0.5 }}
      {...props}
      content={props.content ?? ((contentProps) => <ChartTooltipContent {...contentProps} />)}
      isAnimationActive={animate && motion.enabled ? (props.isAnimationActive ?? 'auto') : false}
      contentStyle={{
        background: 'var(--ui-chart-tooltip-background, var(--ui-surface, #fff))',
        color: 'var(--ui-chart-tooltip-foreground, var(--ui-foreground, #202321))',
        border: `var(--ui-border-width, 1px) solid ${chartGrid}`,
        borderRadius: 'min(var(--ui-radius, 6px), 8px)',
        fontSize: 12,
        padding: '8px 12px',
        ...contentStyle,
      }}
      labelStyle={{ color: 'inherit', fontWeight: 600, ...labelStyle }}
      itemStyle={itemStyle}
      formatter={
        formatter ??
        ((value, name, entry) => [
          Array.isArray(value)
            ? value.map((item) => formatValue(item, locale)).join(' - ')
            : formatValue(value, locale),
          config[String(entry.dataKey)]?.label ?? config[String(name)]?.label ?? name,
        ])
      }
    />
  );
}

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

function useSeries(dataKey: unknown, index?: number) {
  const context = React.useContext(ChartContext);
  const motion = useMotionSettings();
  return {
    color: seriesColor(context.config, dataKey, index),
    animate: context.animate && motion.enabled,
  };
}

export function ChartArea({
  seriesIndex,
  gradient = true,
  ...props
}: AreaProps<ChartDatum, number> & { seriesIndex?: number; gradient?: boolean }) {
  const { color, animate } = useSeries(props.dataKey, seriesIndex);
  const gradientId = `ui-area-${React.useId().replace(/:/g, '')}`;
  const fillColor = props.fill ?? color;
  return (
    <>
      {gradient && !props.fill && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity={0.38} />
            <stop offset="100%" stopColor={fillColor} stopOpacity={0.03} />
          </linearGradient>
        </defs>
      )}
      <Area
        type="monotone"
        stroke={color}
        fill={gradient && !props.fill ? `url(#${gradientId})` : fillColor}
        fillOpacity={gradient && !props.fill ? 1 : 0.18}
        strokeWidth={2}
        dot={false}
        {...props}
        isAnimationActive={animate ? (props.isAnimationActive ?? 'auto') : false}
      />
    </>
  );
}

export function ChartBar({ seriesIndex, ...props }: BarProps & { seriesIndex?: number }) {
  const { color, animate } = useSeries(props.dataKey, seriesIndex);
  return (
    <Bar
      fill={color}
      maxBarSize={32}
      radius={[3, 3, 0, 0]}
      {...props}
      isAnimationActive={animate ? (props.isAnimationActive ?? 'auto') : false}
    />
  );
}

export function ChartLine({ seriesIndex, ...props }: LineProps & { seriesIndex?: number }) {
  const { color, animate } = useSeries(props.dataKey, seriesIndex);
  return (
    <Line
      type="monotone"
      stroke={color}
      strokeWidth={2}
      dot={false}
      activeDot={{ r: 4 }}
      {...props}
      isAnimationActive={animate ? (props.isAnimationActive ?? 'auto') : false}
    />
  );
}

export function ChartPie({ ...props }: PieProps<ChartDatum, number>) {
  const { animate } = useSeries(props.dataKey);
  return (
    <Pie {...props} isAnimationActive={animate ? (props.isAnimationActive ?? 'auto') : false} />
  );
}

type EngineChartProps = Omit<
  React.ComponentProps<typeof RechartsLineChart>,
  'data' | 'children' | 'width' | 'height' | 'responsive'
>;

export interface CartesianChartProps extends Omit<ChartProps, 'children' | 'data'> {
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
export type AreaChartProps = CartesianChartProps;
export type BarChartProps = CartesianChartProps;
export type LineChartProps = CartesianChartProps;

function CartesianChart({
  kind,
  forwardedRef,
  allProps,
}: {
  kind: 'area' | 'bar' | 'line' | 'composed';
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
  const Engine =
    kind === 'area'
      ? RechartsAreaChart
      : kind === 'bar'
        ? RechartsBarChart
        : kind === 'composed'
          ? RechartsComposedChart
          : RechartsLineChart;
  const vertical = chartProps?.layout === 'vertical';
  const tableColumns = columns ?? [
    { key: index, label: config?.[index]?.label ?? index },
    ...entries.map((item) => ({
      key: item.dataKey,
      label: mergedConfig[item.dataKey]?.label ?? item.dataKey,
      format: (value: unknown) =>
        typeof value === 'number' && valueFormatter
          ? valueFormatter(value)
          : formatValue(value, props.locale),
    })),
  ];
  return (
    <Chart {...props} ref={forwardedRef} data={data} config={mergedConfig} columns={tableColumns}>
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
        {entries.map((item, seriesIndex) => {
          const seriesProps = {
            dataKey: item.dataKey,
            name: item.label ?? item.dataKey,
            stackId: item.stackId ?? (stacked ? 'total' : undefined),
            yAxisId: item.yAxisId,
            seriesIndex,
            strokeDasharray: item.strokeDasharray,
          };
          const type = kind === 'composed' ? (item.type ?? 'line') : kind;
          return type === 'bar' ? (
            <ChartBar key={item.dataKey} {...seriesProps} {...item.barProps} />
          ) : type === 'area' ? (
            <ChartArea key={item.dataKey} {...seriesProps} type={curve} {...item.areaProps} />
          ) : (
            <ChartLine key={item.dataKey} {...seriesProps} type={curve} {...item.lineProps} />
          );
        })}
        {children}
      </Engine>
    </Chart>
  );
}

export const AreaChart = /* @__PURE__ */ React.forwardRef<HTMLElement, AreaChartProps>(
  (props, ref) => <CartesianChart kind="area" allProps={props} forwardedRef={ref} />,
);
AreaChart.displayName = 'AreaChart';
export const BarChart = /* @__PURE__ */ React.forwardRef<HTMLElement, BarChartProps>(
  (props, ref) => <CartesianChart kind="bar" allProps={props} forwardedRef={ref} />,
);
BarChart.displayName = 'BarChart';
export const LineChart = /* @__PURE__ */ React.forwardRef<HTMLElement, LineChartProps>(
  (props, ref) => <CartesianChart kind="line" allProps={props} forwardedRef={ref} />,
);
LineChart.displayName = 'LineChart';

export interface DonutChartProps extends Omit<ChartProps, 'children' | 'data'> {
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
            : formatValue(value, props.locale),
      },
    ];
    return (
      <Chart
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
export const ComposedChart = React.forwardRef<HTMLElement, CartesianChartProps>((props, ref) => (
  <CartesianChart kind="composed" allProps={props} forwardedRef={ref} />
));
ComposedChart.displayName = 'ComposedChart';
export const PieChart = React.forwardRef<HTMLElement, DonutChartProps>((props, ref) => (
  <DonutChart innerRadius={0} ref={ref} {...props} />
));
PieChart.displayName = 'PieChart';
export interface RadarChartProps extends Omit<ChartProps, 'children' | 'data'> {
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
export const RadarChart = React.forwardRef<HTMLElement, RadarChartProps>(
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
      <Chart {...props} ref={ref} data={data} config={merged}>
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
export interface ScatterChartProps extends Omit<ChartProps, 'children' | 'data'> {
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
export const ScatterChart = React.forwardRef<HTMLElement, ScatterChartProps>(
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
      <Chart {...props} ref={ref} data={data}>
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
export { HeatmapChart } from './heatmap';
export type { HeatmapChartProps, HeatmapDatum } from './heatmap';
export { GanttChart } from './gantt';
export type { GanttChartProps, GanttTask } from './gantt';
