import * as React from 'react';
import { EmptyState } from './primitives';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './table';
import { StyleProvider, useStyles, useDirection, type PlainStyleProps } from './styling';
import { useTranslation, numberFormatter } from './i18n';

export interface HeatmapDatum {
  x: string;
  y: string;
  value: number;
}
export interface HeatmapChartProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'>, PlainStyleProps {
  data: readonly HeatmapDatum[];
  xLabels?: readonly string[];
  yLabels?: readonly string[];
  cellSize?: number;
  labelWidth?: number;
  domain?: readonly [number, number];
  colorScale?: (value: number, domain: readonly [number, number]) => string;
  formatValue?: (value: number) => string;
  formatX?: (value: string) => string;
  formatY?: (value: string) => string;
  showValues?: boolean;
  legend?: boolean;
  dataTable?: 'visible' | 'sr-only' | false;
  onCellClick?: (cell: HeatmapDatum) => void;
  label?: string;
  loading?: boolean;
}
export const HeatmapChart = React.forwardRef<HTMLElement, HeatmapChartProps>(
  (
    {
      data,
      xLabels,
      yLabels,
      cellSize = 32,
      labelWidth = 96,
      domain,
      colorScale,
      formatValue,
      formatX = String,
      formatY = String,
      showValues = false,
      legend = true,
      dataTable = 'sr-only',
      onCellClick,
      label,
      loading,
      className,
      unstyled,
      dir,
      ...props
    },
    ref,
  ) => {
    const styles = useStyles();
    const { t, locale } = useTranslation();
    const direction = useDirection(dir === 'ltr' || dir === 'rtl' ? dir : undefined);
    const x = React.useMemo(() => xLabels ?? [...new Set(data.map((d) => d.x))], [data, xLabels]);
    const y = React.useMemo(() => yLabels ?? [...new Set(data.map((d) => d.y))], [data, yLabels]);
    const index = React.useMemo(() => {
      const rows = new Map<string, Map<string, HeatmapDatum>>();
      for (const cell of data) {
        if (!Number.isFinite(cell.value)) continue;
        const row = rows.get(cell.y) ?? new Map<string, HeatmapDatum>();
        row.set(cell.x, cell);
        rows.set(cell.y, row);
      }
      return rows;
    }, [data]);
    const bounds = React.useMemo<readonly [number, number]>(
      () =>
        domain ??
        data.reduce<[number, number]>(
          (range, cell) =>
            Number.isFinite(cell.value)
              ? [Math.min(range[0], cell.value), Math.max(range[1], cell.value)]
              : range,
          [0, 0],
        ),
      [domain, data],
    );
    const format = formatValue ?? ((value: number) => numberFormatter(locale).format(value));
    const [focused, setFocused] = React.useState(0);
    const activeIndex = Math.min(focused, Math.max(0, x.length * y.length - 1));
    const color = (value: number) =>
      colorScale?.(value, bounds) ??
      `color-mix(in srgb, var(--ui-chart-1, var(--ui-accent)) ${Math.round(Math.max(0, Math.min(1, bounds[1] === bounds[0] ? 1 : (value - bounds[0]) / (bounds[1] - bounds[0]))) * 45 + 10)}%, var(--ui-surface))`;
    return (
      <StyleProvider unstyled={unstyled}>
        <figure
          ref={ref}
          dir={direction}
          aria-label={label ?? t('chart.heatmap')}
          aria-busy={loading || undefined}
          {...styles('heatmap.root', 'ui-heatmap', className, unstyled)}
          {...props}
        >
          {loading || !index.size ? (
            <EmptyState icon={null} title={t(loading ? 'chart.loading' : 'chart.empty')} />
          ) : (
            <div className="ui-heatmap-scroll">
              <div
                role={onCellClick ? 'grid' : 'table'}
                aria-label={label ?? t('chart.heatmap')}
                className="ui-heatmap-grid"
                style={
                  {
                    '--ui-heatmap-size': `${Math.max(24, cellSize)}px`,
                    '--ui-heatmap-columns': x.length,
                    '--ui-heatmap-label-width': `${Math.max(48, labelWidth)}px`,
                  } as React.CSSProperties
                }
                onKeyDown={(event) => {
                  if (
                    !onCellClick ||
                    !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(
                      event.key,
                    )
                  )
                    return;
                  const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
                    '[data-heatmap-index]',
                  );
                  if (!target) return;
                  event.preventDefault();
                  const i = Number(target.dataset.heatmapIndex);
                  let next =
                    event.key === 'Home'
                      ? Math.floor(i / x.length) * x.length
                      : event.key === 'End'
                        ? Math.min(
                            x.length * y.length - 1,
                            Math.floor(i / x.length) * x.length + x.length - 1,
                          )
                        : i +
                          (event.key === 'ArrowUp'
                            ? -x.length
                            : event.key === 'ArrowDown'
                              ? x.length
                              : (event.key === 'ArrowRight') === (direction !== 'rtl')
                                ? 1
                                : -1);
                  next = Math.max(0, Math.min(x.length * y.length - 1, next));
                  setFocused(next);
                  event.currentTarget
                    .querySelector<HTMLButtonElement>(`[data-heatmap-index="${next}"]`)
                    ?.focus();
                }}
              >
                <div role="row" className="ui-heatmap-row">
                  <span role="columnheader" />
                  {x.map((column) => (
                    <span role="columnheader" key={column}>
                      {formatX(column)}
                    </span>
                  ))}
                </div>
                {y.map((row, ri) => (
                  <div role="row" key={row} className="ui-heatmap-row">
                    <span role="rowheader">{formatY(row)}</span>
                    {x.map((column, ci) => {
                      const cell = index.get(row)?.get(column),
                        value = cell?.value,
                        i = ri * x.length + ci;
                      const text = `${formatY(row)}, ${formatX(column)}: ${value === undefined ? t('chart.empty') : format(value)}`;
                      return (
                        <div
                          role={onCellClick ? 'gridcell' : 'cell'}
                          key={column}
                          aria-label={onCellClick ? undefined : text}
                        >
                          {onCellClick ? (
                            <button
                              type="button"
                              aria-disabled={!cell || undefined}
                              tabIndex={activeIndex === i ? 0 : -1}
                              data-heatmap-index={i}
                              onFocus={() => setFocused(i)}
                              aria-label={text}
                              title={text}
                              className="ui-heatmap-cell"
                              style={{
                                background: value === undefined ? 'var(--ui-muted)' : color(value),
                              }}
                              onClick={() => {
                                if (cell) onCellClick(cell);
                              }}
                            >
                              {showValues && value !== undefined ? format(value) : null}
                            </button>
                          ) : (
                            <span
                              title={text}
                              className="ui-heatmap-cell"
                              style={{
                                background: value === undefined ? 'var(--ui-muted)' : color(value),
                              }}
                            >
                              {showValues && value !== undefined ? format(value) : null}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
          {legend && index.size > 0 && (
            <figcaption className="ui-heatmap-legend">
              <span>{format(bounds[0])}</span>
              {Array.from({ length: 5 }, (_, i) => (
                <i
                  key={i}
                  style={{ background: color(bounds[0] + ((bounds[1] - bounds[0]) * i) / 4) }}
                  aria-hidden="true"
                />
              ))}
              <span>{format(bounds[1])}</span>
            </figcaption>
          )}
          {dataTable !== false && (
            <div className={dataTable === 'sr-only' ? 'ui-visually-hidden' : undefined}>
              <Table aria-label={t('chart.data', { label: label ?? t('chart.heatmap') })}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('chart.row')}</TableHead>
                    <TableHead>{t('chart.column')}</TableHead>
                    <TableHead>{t('chart.value')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data
                    .filter((d) => Number.isFinite(d.value))
                    .map((cell, i) => (
                      <TableRow key={i}>
                        <TableCell>{formatY(cell.y)}</TableCell>
                        <TableCell>{formatX(cell.x)}</TableCell>
                        <TableCell>{format(cell.value)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </figure>
      </StyleProvider>
    );
  },
);
HeatmapChart.displayName = 'HeatmapChart';
