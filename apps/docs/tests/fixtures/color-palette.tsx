import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  PlainProvider,
  ThemeScope,
  Button,
  createTheme,
  useColorPalette,
  useTheme,
} from '@plain/ui';
import { BarChart, DonutChart } from '@plain/ui/charts';
import '@plain/ui/styles.css';
import '@plain/ui/charts.css';

const query = new URLSearchParams(location.search);
const brand = createTheme({ color: '#087f5b' });
const metrics = Array.from({ length: 16 }, (_, index) => ({
  key: `metric${index}`,
  label: `Metric ${index + 1}`,
}));
const data = [
  {
    name: 'April',
    ...Object.fromEntries(metrics.map((metric, index) => [metric.key, 16 + ((index * 13) % 50)])),
  },
  {
    name: 'May',
    ...Object.fromEntries(metrics.map((metric, index) => [metric.key, 20 + ((index * 17) % 60)])),
  },
];
function Swatches({ name, count = 24 }: { name: string; count?: number }) {
  const palette = useColorPalette();
  return (
    <ul
      aria-label={name}
      style={{
        margin: 0,
        padding: 0,
        listStyle: 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,96px),1fr))',
        gap: 12,
      }}
    >
      {palette.take(count).map((color, index) => (
        <li key={index} data-color={color} style={{ display: 'grid', minWidth: 0, gap: 4 }}>
          <span aria-hidden="true" style={{ background: color, height: 32, borderRadius: 4 }} />
          <bdi dir="ltr" style={{ fontSize: 12 }}>
            {index + 1}. {color}
          </bdi>
        </li>
      ))}
    </ul>
  );
}
function Fixture() {
  const [count, setCount] = React.useState(24);
  const [reversed, setReversed] = React.useState(false);
  const palette = useColorPalette();
  const { setTheme, resolvedMode } = useTheme();
  const keys = reversed ? ['gamma', 'beta', 'alpha'] : ['alpha', 'beta', 'gamma'];
  return (
    <main style={{ padding: 16, maxWidth: 1040, margin: 'auto', display: 'grid', gap: 24 }}>
      <h1>Theme color palettes</h1>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button onClick={() => setTheme({ mode: resolvedMode === 'dark' ? 'light' : 'dark' })}>
          Toggle mode
        </Button>
        <Button onClick={() => setTheme({ color: '#2563eb' })}>Blue theme</Button>
        <Button onClick={() => setTheme({ color: '#be185d' })}>Rose theme</Button>
        <Button onClick={() => setTheme({ color: null, accent: 'neutral' })}>Neutral theme</Button>
        <Button onClick={() => setCount(48)}>More colors</Button>
        <Button onClick={() => setReversed((value) => !value)}>Reverse items</Button>
      </div>
      <section aria-label="Root palette">
        <h2>Current theme</h2>
        <Swatches name="Root colors" count={count} />
      </section>
      <BarChart
        label="Default palette chart"
        data={data}
        index="name"
        height={260}
        series={metrics.slice(0, 8).map((metric) => ({ dataKey: metric.key, label: metric.label }))}
      />
      <DonutChart
        label="Default donut palette"
        data={metrics
          .slice(0, 8)
          .map((metric, index) => ({ name: metric.label, value: 8 + index * 4 }))}
        height={260}
      />
      <BarChart
        label="Custom series color"
        data={data}
        index="name"
        height={180}
        series={[{ dataKey: 'metric0', label: 'Custom', color: '#d946ef' }]}
      />
      <BarChart
        label="Generated palette chart"
        data={data}
        index="name"
        height={260}
        legend={false}
        series={metrics.map((metric, index) => ({
          dataKey: metric.key,
          label: metric.label,
          color: palette.get(index),
        }))}
      />
      <ul
        aria-label="Keyed items"
        style={{
          padding: 0,
          margin: 0,
          listStyle: 'none',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {keys.map((key) => (
          <li key={key} data-key={key} data-color={palette.forKey(key)}>
            {key}: {palette.forKey(key)}
          </li>
        ))}
      </ul>
      <ThemeScope
        mode="dark"
        tokens={brand.dark}
        style={{
          padding: 16,
          minWidth: 0,
          background: 'var(--ui-surface)',
          color: 'var(--ui-foreground)',
        }}
      >
        <section aria-label="Local brand palette">
          <h2>Scoped brand</h2>
          <Swatches name="Scoped colors" count={12} />
          <BarChart
            label="Scoped default palette chart"
            data={data}
            index="name"
            height={180}
            series={metrics
              .slice(0, 2)
              .map((metric) => ({ dataKey: metric.key, label: metric.label }))}
          />
        </section>
      </ThemeScope>
      <ThemeScope
        mode="dark"
        style={{
          padding: 16,
          minWidth: 0,
          background: 'var(--ui-surface)',
          color: 'var(--ui-foreground)',
        }}
      >
        <section aria-label="Neutral dark palette">
          <h2>Scoped dark mode</h2>
          <Swatches name="Dark colors" count={12} />
          <BarChart
            label="Dark neutral chart"
            data={data}
            index="name"
            height={180}
            series={metrics
              .slice(0, 2)
              .map((metric) => ({ dataKey: metric.key, label: metric.label }))}
          />
        </section>
      </ThemeScope>
      <output aria-label="Distant color">{palette.get(1000000)}</output>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PlainProvider
      persist={false}
      dir={query.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
      theme={{
        color: query.get('seed'),
        mode:
          query.get('mode') === 'system'
            ? 'system'
            : query.get('mode') === 'dark'
              ? 'dark'
              : 'light',
        motion: 'none',
      }}
    >
      <Fixture />
    </PlainProvider>
  </React.StrictMode>,
);
