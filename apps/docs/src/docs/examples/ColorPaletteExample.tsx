import * as React from 'react';
import { Button, useColorPalette } from '@plain/ui';

export function ColorPaletteExample() {
  const [count, setCount] = React.useState(24);
  const palette = useColorPalette();
  const colors = React.useMemo(() => palette.take(count), [palette, count]);
  return (
    <div style={{ minWidth: 0, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <output aria-live="polite" style={{ marginInlineEnd: 'auto' }}>
          {count} theme colors
        </output>
        <Button
          variant="outline"
          size="sm"
          disabled={count >= 64}
          onClick={() => setCount((value) => value + 8)}
        >
          Add 8 colors
        </Button>
        <Button variant="ghost" size="sm" disabled={count === 24} onClick={() => setCount(24)}>
          Reset colors
        </Button>
      </div>
      <ul
        aria-label="Generated theme colors"
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 96px), 1fr))',
          gap: 12,
        }}
      >
        {colors.map((color, index) => (
          <li key={index} style={{ minWidth: 0, display: 'grid', gap: 4 }}>
            <span
              aria-hidden="true"
              style={{ height: 32, background: color, borderRadius: 'min(var(--ui-radius), 6px)' }}
            />
            <bdi dir="ltr" style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
              {index + 1}. <code>{color}</code>
            </bdi>
          </li>
        ))}
      </ul>
      <p style={{ margin: 0, color: 'var(--ui-muted-foreground)', fontSize: 12 }}>
        Adding colors keeps existing assignments. The global theme editor updates this palette. This
        demo displays up to 64 colors; the utility has no eight-color limit.
      </p>
    </div>
  );
}

export const colorPaletteCode = `import { useColorPalette } from '@plain/ui';
import { BarChart } from '@plain/ui/charts';
import '@plain/ui/charts.css';

function RevenueChart({ data, metrics }: {
  data: Record<string, unknown>[];
  metrics: { key: string; label: string; id: string }[];
}) {
  const palette = useColorPalette();
  const series = metrics.map((metric, index) => ({
    dataKey: metric.key,
    label: metric.label,
    color: palette.get(index),
  }));
  // Pass series to a P.UI chart, or palette.take(24) to another library.
  // Use palette.forKey(metric.id) for assignments that survive reordering.
  return <BarChart data={data} series={series} label="Revenue by metric" />;
}`;
