import * as React from 'react';
import { type LineProps, type BarProps, type AreaProps, ResponsiveContainer } from 'recharts';
import {
  type PlainStyleProps,
  useStyles,
  useDirection,
  StyleProvider,
  DirectionProvider,
} from './style-context';
import { type ChartSkeletonVariant, ChartSkeleton } from './chart-skeleton';
import { useTranslation } from './i18n';
import { useMotionSettings } from './motion-policy';
import {
  discoverSeries,
  getColumns,
  loadingAppearance,
  ChartContext,
  hiddenStyle,
  formatValue,
} from './charts-internal';
import {
  Table,
  TableCaption,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from './table';

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
  /** Override the inferred skeleton shape for a custom chart composition. */
  loadingVariant?: ChartSkeletonVariant;
  emptyLabel?: string;
  tableLabel?: string;
  /** False is appropriate when an explicit description conveys the chart's data. */
  dataTable?: 'sr-only' | 'visible' | false;
  animate?: boolean;
  children: React.ReactElement;
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
      loadingVariant,
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
    const placeholder = loading ? loadingAppearance(children) : undefined;
    return (
      <StyleProvider unstyled={unstyled}>
        <DirectionProvider dir={direction}>
          <ChartContext.Provider value={context}>
            {styles.tooltip(
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
                  {loading ? (
                    <ChartSkeleton
                      {...placeholder}
                      variant={loadingVariant ?? placeholder?.variant}
                      height="100%"
                      label={loadingLabel}
                      animate={context.animate}
                    />
                  ) : empty ? (
                    <div
                      {...styles('chart.status', 'ui-chart-status', undefined, unstyled)}
                      role="status"
                      aria-live="polite"
                    >
                      <span>{emptyLabel}</span>
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
                      aria-label={tableLabel ?? language.t('chart.data', { label })}
                      {...styles('chart.table', 'ui-chart-table', undefined, unstyled)}
                    >
                      <TableCaption>
                        {tableLabel ?? language.t('chart.data', { label })}
                      </TableCaption>
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
                              const value = column.accessor
                                ? column.accessor(row)
                                : row[column.key];
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
              </figure>,
              unstyled,
            )}
          </ChartContext.Provider>
        </DirectionProvider>
      </StyleProvider>
    );
  },
);

Chart.displayName = 'Chart';
