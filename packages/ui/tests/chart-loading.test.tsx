import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import {
  AreaChart,
  BarChart,
  LineChart,
  ComposedChart,
  DonutChart,
  PieChart,
  RadarChart,
  ScatterChart,
  HeatmapChart,
  GanttChart,
  Chart,
  ChartLine,
  ChartSkeleton as ChartsSkeleton,
} from '../src/ui/charts';
import { ChartSkeleton } from '../src/ui/chart-skeleton';
import { LineChart as RechartsLineChart } from 'recharts';
import { StyleProvider } from '../src/ui/styling';
import { LanguageProvider } from '../src/ui/i18n';
import { MotionPolicyProvider } from '../src/ui/motion-policy';

const data = [{ name: 'Private value', value: 42, x: 4, y: 8 }];
const common = { data, loading: true, height: 248, dataTable: 'visible' as const };
const cases = [
  ['area', <AreaChart {...common} />],
  ['bar', <BarChart {...common} />],
  ['line', <LineChart {...common} />],
  ['composed', <ComposedChart {...common} />],
  ['donut', <DonutChart {...common} />],
  ['pie', <PieChart {...common} />],
  ['radar', <RadarChart {...common} series={[{ dataKey: 'value' }]} />],
  ['scatter', <ScatterChart {...common} xKey="x" yKey="y" />],
  [
    'heatmap',
    <HeatmapChart loading dataTable="visible" data={[{ x: 'Private value', y: 'A', value: 42 }]} />,
  ],
  [
    'gantt',
    <GanttChart
      loading
      height={248}
      dataTable="visible"
      tasks={[{ id: 'a', label: 'Private value', start: '2026-11-01', end: '2026-11-05' }]}
    />,
  ],
] as const;

describe('chart loading', () => {
  afterEach(() => vi.restoreAllMocks());
  it.each(cases)(
    'uses a decorative %s placeholder without exposing stale plots or data',
    (variant, element) => {
      const { container } = render(element);
      const root = container.querySelector('figure');
      const skeleton = container.querySelector('[data-ui="chart-skeleton"][data-slot="root"]');
      expect(root).toHaveAttribute('aria-busy', 'true');
      expect(skeleton).toHaveAttribute('data-variant', variant);
      expect(skeleton).toHaveTextContent('Loading chart');
      expect(skeleton?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.queryByText('Private value')).toBeNull();
      expect(screen.queryByRole('table')).toBeNull();
      expect(screen.queryByRole('button')).toBeNull();
      expect(container.querySelector('.recharts-wrapper')).toBeNull();
    },
  );

  it('replaces loading with an accessible plot and preserves its viewport height', async () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 640,
      height: 248,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 640,
      bottom: 248,
      toJSON: () => ({}),
    });
    const { container, rerender } = render(<BarChart {...common} label="Sales" />);
    expect(container.querySelector('[data-slot="viewport"]')).toHaveStyle({ height: '248px' });
    rerender(<BarChart {...common} loading={false} label="Sales" animate={false} />);
    await waitFor(() => expect(screen.getByRole('application')).toBeInTheDocument());
    expect(container.querySelector('[data-ui="chart-skeleton"]')).toBeNull();
    expect(screen.getByRole('figure', { name: 'Sales' })).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('table')).toHaveTextContent('Private value');
    expect(container.querySelector('[data-slot="viewport"]')).toHaveStyle({ height: '248px' });
    rerender(<BarChart data={[]} label="Sales" emptyLabel="No sales" height={248} />);
    expect(screen.getByRole('status')).toHaveTextContent('No sales');
    expect(container.querySelector('svg')).toBeNull();
  });

  it('honors custom compositions, hidden legends, horizontal bars and announcements', () => {
    const { container, rerender } = render(
      <BarChart
        {...common}
        legend={false}
        chartProps={{ layout: 'vertical' }}
        loadingLabel="Fetching sales"
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Fetching sales');
    const bar = container.querySelector('svg rect[x="64"][height="14"]');
    expect(bar).toHaveAttribute('height', '14');
    expect(container.querySelector('svg circle')).toBeNull();
    rerender(
      <Chart data={data} loading loadingVariant="scatter">
        <RechartsLineChart data={data}>
          <ChartLine dataKey="value" />
        </RechartsLineChart>
      </Chart>,
    );
    expect(screen.getByRole('status')).toHaveAttribute('data-variant', 'scatter');
  });

  it.each(['reduced', 'none'] as const)('makes loading static under %s motion', (policy) => {
    const { container } = render(
      <MotionPolicyProvider policy={policy}>
        <AreaChart {...common} />
      </MotionPolicyProvider>,
    );
    expect(screen.getByRole('status')).toHaveAttribute('data-motion', 'disabled');
    expect(container.querySelector('.ui-skeleton')).toBeNull();
  });

  it('supports localized announcements, native props, refs and unstyled slot overrides', () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(
      <LanguageProvider locale="ar" messages={{ 'chart.loading': 'جارٍ تحميل الرسم' }}>
        <StyleProvider
          unstyled
          styles={{ 'chart-skeleton.root': 'custom-root', 'chart-skeleton.grid': 'custom-grid' }}
        >
          <ChartSkeleton ref={ref} id="waiting" variant="bar" animate={false} />
        </StyleProvider>
      </LanguageProvider>,
    );
    expect(ref.current).toBe(screen.getByRole('status'));
    expect(ref.current).toHaveAttribute('id', 'waiting');
    expect(ref.current).toHaveTextContent('جارٍ تحميل الرسم');
    expect(ref.current).toHaveClass('custom-root');
    expect(container.querySelector('.custom-grid')).toBeInTheDocument();
    expect(container.querySelector('[class*="ui-chart-skeleton"]')).toBeNull();
    expect(container.querySelector('.ui-skeleton')).toBeNull();
  });

  it('renders an engine-free, static fallback on the server through either public export', () => {
    expect(ChartsSkeleton).toBe(ChartSkeleton);
    const markup = renderToString(
      <ChartSkeleton variant="gantt" height={400} animate={false} showTaskList={false} />,
    );
    expect(markup).toContain('role="status"');
    expect(markup).toContain('height:400px');
    expect(markup).not.toContain('recharts');
    expect(markup).not.toContain('ui-skeleton"');
  });
});
