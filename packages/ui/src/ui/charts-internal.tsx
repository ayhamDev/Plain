import * as React from 'react';
import {
  type ChartConfig,
  type ChartDatum,
  type ChartColumn,
  type ChartSeries,
} from './chart-base';
import { numberFormatter, dateFormatter } from './i18n';
import { chartPalette } from './chart-palette';
import { type ChartSkeletonVariant } from './chart-skeleton';
import { useMotionSettings } from './motion-policy';
import { type LineChart as RechartsLineChart } from 'recharts';

export const chartLabel = 'var(--ui-chart-label, var(--ui-muted-foreground, #666b68))';

export const chartGrid = 'var(--ui-chart-grid, var(--ui-border, #e5e7e6))';

export const hiddenStyle: React.CSSProperties = {
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

export const ChartContext = /* @__PURE__ */ React.createContext<ChartContextValue>({
  config: {},
  animate: true,
});

export function formatValue(value: unknown, locale?: string): React.ReactNode {
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

export function getColumns(data: readonly ChartDatum[], config: ChartConfig): ChartColumn[] {
  return [...new Set(data.flatMap((row) => Object.keys(row)))].map((key) => ({
    key,
    label: config[key]?.label ?? key,
  }));
}

export function seriesColor(config: ChartConfig, dataKey: unknown, index = 0) {
  const key = typeof dataKey === 'string' || typeof dataKey === 'number' ? String(dataKey) : '';
  const configuredIndex = Object.keys(config).indexOf(key);
  return (
    config[key]?.color ??
    chartPalette[(configuredIndex >= 0 ? configuredIndex : index) % chartPalette.length]
  );
}

export function discoverSeries(children: React.ReactNode, config: ChartConfig): ChartConfig {
  const result: ChartConfig = {};
  const visit = (nodes: React.ReactNode) => {
    React.Children.forEach(nodes, (node) => {
      if (!React.isValidElement<{ dataKey?: unknown; children?: React.ReactNode }>(node)) return;
      if (['ChartArea', 'ChartLine', 'ChartBar'].includes(componentName(node.type))) {
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

function componentName(type: unknown): string {
  return typeof type === 'function' || (typeof type === 'object' && type !== null)
    ? ((type as { displayName?: string }).displayName ?? '')
    : '';
}

const loadingVariants: Record<string, ChartSkeletonVariant> = {
  AreaChart: 'area',
  BarChart: 'bar',
  LineChart: 'line',
  ComposedChart: 'composed',
  RadarChart: 'radar',
  ScatterChart: 'scatter',
  PieChart: 'pie',
};

const seriesVariants: Record<string, ChartSkeletonVariant> = {
  ChartArea: 'area',
  Area: 'area',
  ChartBar: 'bar',
  Bar: 'bar',
  ChartLine: 'line',
  Line: 'line',
  ChartPie: 'pie',
  Pie: 'pie',
  Radar: 'radar',
  Scatter: 'scatter',
};

export function loadingAppearance(child: React.ReactElement) {
  let variant = loadingVariants[componentName(child.type)] ?? 'line';
  let legend = false;
  let grid = false;
  let xAxis = false;
  let yAxis = false;
  const series = new Set<ChartSkeletonVariant>();
  const visit = (nodes: React.ReactNode) =>
    React.Children.forEach(nodes, (node) => {
      if (
        !React.isValidElement<{
          innerRadius?: number | string;
          children?: React.ReactNode;
          hide?: boolean;
          horizontal?: boolean;
          vertical?: boolean;
        }>(node)
      )
        return;
      const name = componentName(node.type);
      if (seriesVariants[name]) series.add(seriesVariants[name]);
      if (name === 'ChartLegend' || name === 'Legend') legend = true;
      if (name === 'ChartXAxis' || name === 'XAxis') xAxis ||= !node.props.hide;
      if (name === 'ChartYAxis' || name === 'YAxis') yAxis ||= !node.props.hide;
      if (
        name === 'PolarGrid' ||
        ((name === 'ChartGrid' || name === 'CartesianGrid') &&
          (node.props.horizontal !== false || node.props.vertical !== false))
      )
        grid = true;
      if (
        (name === 'ChartPie' || name === 'Pie') &&
        node.props.innerRadius &&
        parseFloat(String(node.props.innerRadius)) > 0
      )
        variant = 'donut';
      visit(node.props.children);
    });
  const props = child.props as { layout?: 'horizontal' | 'vertical'; children?: React.ReactNode };
  visit(props.children);
  if (variant !== 'donut' && !loadingVariants[componentName(child.type)] && series.size) {
    variant = series.size > 1 ? 'composed' : [...series][0];
  }
  return { variant, legend, grid, xAxis, yAxis, layout: props.layout };
}

export function useSeries(dataKey: unknown, index?: number) {
  const context = React.useContext(ChartContext);
  const motion = useMotionSettings();
  return {
    color: seriesColor(context.config, dataKey, index),
    animate: context.animate && motion.enabled,
  };
}

export type EngineChartProps = Omit<
  React.ComponentProps<typeof RechartsLineChart>,
  'data' | 'children' | 'width' | 'height' | 'responsive'
>;

export function seriesProps(item: ChartSeries, seriesIndex: number, stacked: boolean) {
  return {
    dataKey: item.dataKey,
    name: item.label ?? item.dataKey,
    stackId: item.stackId ?? (stacked ? 'total' : undefined),
    yAxisId: item.yAxisId,
    seriesIndex,
    strokeDasharray: item.strokeDasharray,
  };
}
