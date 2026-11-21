import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Button, PlainProvider, ChartSkeleton, ThemeScope } from '@plain/ui';
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
} from '@plain/ui/charts';
import '@plain/ui/styles.css';
import '@plain/ui/charts.css';

const params = new URLSearchParams(location.search);
const data = [
  { name: 'Jan', value: 32, other: 20, x: 1, y: 8 },
  { name: 'Feb', value: 24, other: 28, x: 3, y: 15 },
  { name: 'Mar', value: 48, other: 36, x: 5, y: 24 },
];

function Gallery() {
  const [state, setState] = React.useState('loading');
  const common = {
    data: state === 'empty' ? [] : data,
    loading: state === 'loading',
    height: 240,
    animate: state === 'loading',
  };
  const cartesian = { ...common, series: [{ dataKey: 'value', label: 'Revenue' }] };
  const families = [
    ['area', <AreaChart {...cartesian} label="Area revenue" />],
    ['bar', <BarChart {...cartesian} label="Bar revenue" />],
    ['line', <LineChart {...cartesian} label="Line revenue" />],
    ['composed', <ComposedChart {...cartesian} label="Combined revenue" />],
    ['donut', <DonutChart {...common} label="Revenue breakdown" />],
    ['pie', <PieChart {...common} label="Revenue split" />],
    ['radar', <RadarChart {...cartesian} label="Team capabilities" />],
    ['scatter', <ScatterChart {...common} xKey="x" yKey="y" label="Effort and results" />],
    [
      'heatmap',
      <HeatmapChart
        loading={common.loading}
        label="Workload"
        data={state === 'empty' ? [] : data.map((d) => ({ x: d.name, y: 'Team', value: d.value }))}
      />,
    ],
    [
      'gantt',
      <GanttChart
        loading={common.loading}
        height={240}
        label="Delivery"
        tasks={
          state === 'empty'
            ? []
            : [{ id: 'a', label: 'Research', start: '2026-11-01', end: '2026-11-06' }]
        }
      />,
    ],
  ] as const;
  return (
    <main style={{ margin: '0 auto', padding: 16, maxWidth: 1120 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Chart loading states</h1>
      <nav
        aria-label="Preview states"
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}
      >
        {['loading', 'ready', 'empty'].map((value) => (
          <Button key={value} onClick={() => setState(value)}>
            {value}
          </Button>
        ))}
      </nav>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
          gap: 24,
        }}
      >
        {families
          .filter(([name]) => !params.has('variant') || name === params.get('variant'))
          .map(([name, chart]) => (
            <section key={name} data-testid={name} style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 16, marginBottom: 16 }}>{name}</h2>
              {chart}
            </section>
          ))}
      </div>
      <section aria-label="Scoped fallback" style={{ marginTop: 32 }}>
        <ThemeScope tokens={{ 'skeleton.background': '#89a8bb' }}>
          <ChartSkeleton variant="area" height={160} label="Preparing scoped chart" />
        </ThemeScope>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PlainProvider
      persist={false}
      dir={params.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
      locale={params.get('locale') ?? 'en'}
      theme={{
        mode: params.get('theme') === 'dark' ? 'dark' : 'light',
        motion:
          params.get('motion') === 'none'
            ? 'none'
            : params.get('motion') === 'reduced'
              ? 'reduced'
              : 'system',
      }}
    >
      <Gallery />
    </PlainProvider>
  </React.StrictMode>,
);
