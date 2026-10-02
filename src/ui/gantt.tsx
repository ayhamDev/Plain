import * as React from 'react';
import { Temporal } from 'temporal-polyfill';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './table';
import { EmptyState } from './primitives';
import { useDirection, useStyles, StyleProvider, type PlainStyleProps } from './styling';
import { dateFormatter, numberFormatter, useTranslation } from './i18n';

export interface GanttTask<T = Record<string, unknown>> {
  id: string;
  label: string;
  start: string;
  end: string;
  progress?: number;
  color?: string;
  dependencies?: readonly string[];
  disabled?: boolean;
  data?: T;
}
export interface GanttChartProps<T = Record<string, unknown>>
  extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'>, PlainStyleProps {
  tasks: readonly GanttTask<T>[];
  start?: string;
  end?: string;
  scale?: 'day' | 'week' | 'month';
  dayWidth?: number;
  rowHeight?: number;
  /** Fixed task-label width; omitted widths adapt to the chart's own viewport. */
  labelWidth?: number;
  height?: number;
  onTaskClick?: (task: GanttTask<T>) => void;
  onTaskChange?: (task: GanttTask<T>, previous: GanttTask<T>, reason: 'move' | 'resize') => void;
  renderTask?: (task: GanttTask<T>) => React.ReactNode;
  renderLabel?: (task: GanttTask<T>) => React.ReactNode;
  dataTable?: 'visible' | 'sr-only' | false;
  label?: string;
  loading?: boolean;
  showDependencies?: boolean;
}
export function ganttRange(start: string, end: string) {
  try {
    const from = Temporal.PlainDate.from(start),
      to = Temporal.PlainDate.from(end);
    return Temporal.PlainDate.compare(to, from) > 0
      ? { from, to, days: from.until(to).days }
      : undefined;
  } catch {
    return undefined;
  }
}
export function GanttChart<T>({
  tasks,
  start,
  end,
  scale = 'day',
  dayWidth,
  rowHeight = 44,
  labelWidth: fixedLabelWidth,
  height = 400,
  onTaskClick,
  onTaskChange,
  renderTask,
  renderLabel,
  dataTable = 'sr-only',
  label,
  loading,
  showDependencies = true,
  className,
  unstyled,
  dir,
  ...props
}: GanttChartProps<T>) {
  const styles = useStyles();
  const { t, locale } = useTranslation();
  const direction = useDirection(dir === 'ltr' || dir === 'rtl' ? dir : undefined);
  const viewport = React.useRef<HTMLDivElement>(null);
  const rows = React.useMemo(
    () =>
      tasks.flatMap((task) => {
        const range = ganttRange(task.start, task.end);
        return range ? [{ task, ...range }] : [];
      }),
    [tasks],
  );
  const range = React.useMemo(() => {
    const first =
      start ??
      rows.reduce<string | undefined>(
        (value, row) => (!value || row.task.start < value ? row.task.start : value),
        undefined,
      );
    const last =
      end ??
      rows.reduce<string | undefined>(
        (value, row) => (!value || row.task.end > value ? row.task.end : value),
        undefined,
      );
    return first && last ? ganttRange(first, last) : undefined;
  }, [rows, start, end]);
  const px = Math.max(4, dayWidth ?? (scale === 'month' ? 6 : scale === 'week' ? 16 : 40)),
    rh = Math.max(36, rowHeight),
    days = range?.days ?? 0,
    width = days * px;
  const virtual = useVirtualizer({
    count: rows.length,
    getScrollElement: () => viewport.current,
    estimateSize: () => rh,
    overscan: 5,
    initialRect: { height, width: 800 },
    getItemKey: (index) => rows[index].task.id,
  });
  const items = virtual.getVirtualItems();
  const labelWidth =
    fixedLabelWidth ??
    Math.round(Math.min(184, Math.max(96, (virtual.scrollRect?.width ?? 800) * 0.38)));
  const dateText = (date: Temporal.PlainDate) => {
    const d = new Date(0);
    d.setUTCFullYear(date.year, date.month - 1, date.day);
    return dateFormatter(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(d);
  };
  const layout = (row: (typeof rows)[number]) => {
    const left = range ? Math.max(0, range.from.until(row.from).days) : 0;
    const right = range ? Math.min(days, range.from.until(row.to).days) : 0;
    return { left: left * px, width: Math.max(0, (right - left) * px) };
  };
  const ticks = React.useMemo(() => {
    if (!range) return [];
    const result: { index: number; date: Temporal.PlainDate }[] = [];
    let date = range.from;
    while (Temporal.PlainDate.compare(date, range.to) < 0) {
      result.push({ index: range.from.until(date).days, date });
      date =
        scale === 'month'
          ? date.with({ day: 1 }).add({ months: 1 })
          : date.add({ days: scale === 'week' ? 7 : 1 });
    }
    return result;
  }, [range, scale]);
  const axis = useVirtualizer({
    horizontal: true,
    count: ticks.length,
    getScrollElement: () => viewport.current,
    estimateSize: (index) => ((ticks[index + 1]?.index ?? days) - ticks[index].index) * px,
    overscan: 4,
    initialRect: { height, width: 800 },
    paddingStart: labelWidth,
    isRtl: direction === 'rtl',
  });
  const TaskElement = onTaskClick || onTaskChange ? 'button' : 'div';
  const visibleIds = new Map(items.map((item) => [rows[item.index].task.id, item]));
  return (
    <StyleProvider unstyled={unstyled}>
      <figure
        aria-label={label ?? t('chart.gantt')}
        aria-busy={loading || undefined}
        dir={direction}
        {...styles('gantt.root', 'ui-gantt', className, unstyled)}
        {...props}
      >
        {loading || !rows.length || !range ? (
          <EmptyState icon={null} title={t(loading ? 'chart.loading' : 'chart.empty')} />
        ) : (
          <div
            ref={viewport}
            role="region"
            tabIndex={0}
            aria-label={t('table.scrollArea', { label: label ?? t('chart.gantt') })}
            className="ui-gantt-scroll"
            style={
              {
                height,
                '--ui-gantt-label-width': `${labelWidth}px`,
                '--ui-gantt-width': `${width}px`,
                '--ui-gantt-day-width': `${px}px`,
              } as React.CSSProperties
            }
          >
            <div className="ui-gantt-header">
              <strong>{t('chart.task')}</strong>
              <div>
                {axis.getVirtualItems().map((item) => {
                  const tick = ticks[item.index];
                  return (
                    <span key={tick.index} style={{ insetInlineStart: tick.index * px }}>
                      {dateText(tick.date)}
                    </span>
                  );
                })}
              </div>
            </div>
            <div
              className="ui-gantt-body"
              style={{ height: virtual.getTotalSize(), width: width + labelWidth }}
            >
              {items.map((item) => {
                const row = rows[item.index],
                  position = layout(row),
                  progress = Math.max(0, Math.min(100, row.task.progress ?? 0));
                return (
                  <div
                    className="ui-gantt-row"
                    key={row.task.id}
                    style={{ height: rh, transform: `translateY(${item.start}px)` }}
                  >
                    <div className="ui-gantt-label" title={row.task.label}>
                      <div className="ui-gantt-label-content">
                        {renderLabel?.(row.task) ?? row.task.label}
                      </div>
                    </div>
                    <div className="ui-gantt-lane">
                      {position.width > 0 && (
                        <TaskElement
                          {...(TaskElement === 'button'
                            ? { type: 'button' as const, disabled: row.task.disabled }
                            : { role: 'img', tabIndex: 0 })}
                          className="ui-gantt-task"
                          style={
                            {
                              insetInlineStart: position.left,
                              width: position.width,
                              '--ui-gantt-task-color': row.task.color ?? 'var(--ui-accent)',
                            } as React.CSSProperties
                          }
                          aria-label={`${row.task.label}, ${dateText(row.from)} - ${dateText(row.to)}, ${numberFormatter(locale).format(progress)}%`}
                          title={`${row.task.label}: ${dateText(row.from)} - ${dateText(row.to)}`}
                          onClick={() => onTaskClick?.(row.task)}
                          onKeyDown={(event) => {
                            if (
                              !event.altKey ||
                              !onTaskChange ||
                              !['ArrowLeft', 'ArrowRight'].includes(event.key)
                            )
                              return;
                            event.preventDefault();
                            const delta =
                              (event.key === 'ArrowRight') === (direction !== 'rtl') ? 1 : -1;
                            const next = {
                              ...row.task,
                              start: event.shiftKey
                                ? row.task.start
                                : row.from.add({ days: delta }).toString(),
                              end: row.to.add({ days: delta }).toString(),
                            };
                            if (ganttRange(next.start, next.end))
                              onTaskChange(next, row.task, event.shiftKey ? 'resize' : 'move');
                          }}
                        >
                          <span
                            className="ui-gantt-progress"
                            style={{ width: `${progress}%` }}
                            aria-hidden="true"
                          />
                          <span>{renderTask?.(row.task) ?? row.task.label}</span>
                        </TaskElement>
                      )}
                    </div>
                  </div>
                );
              })}
              {showDependencies && (
                <svg
                  className="ui-gantt-dependencies"
                  style={{ insetInlineStart: labelWidth }}
                  width={width}
                  height={virtual.getTotalSize()}
                  aria-hidden="true"
                >
                  {items.flatMap((item) => {
                    const row = rows[item.index],
                      target = layout(row);
                    return (row.task.dependencies ?? []).flatMap((id) => {
                      const sourceItem = visibleIds.get(id);
                      if (!sourceItem) return [];
                      const source = layout(rows[sourceItem.index]),
                        x1 =
                          direction === 'rtl'
                            ? width - source.left - source.width
                            : source.left + source.width,
                        x2 = direction === 'rtl' ? width - target.left : target.left,
                        y1 = sourceItem.start + rh / 2,
                        y2 = item.start + rh / 2;
                      return [
                        <path
                          key={`${id}:${row.task.id}`}
                          d={`M ${x1} ${y1} H ${(x1 + x2) / 2} V ${y2} H ${x2}`}
                        />,
                      ];
                    });
                  })}
                </svg>
              )}
            </div>
          </div>
        )}
        {dataTable !== false && (
          <div className={dataTable === 'sr-only' ? 'ui-visually-hidden' : undefined}>
            <Table aria-label={t('chart.data', { label: label ?? t('chart.gantt') })}>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('chart.task')}</TableHead>
                  <TableHead>{t('calendar.start')}</TableHead>
                  <TableHead>{t('calendar.end')}</TableHead>
                  <TableHead>{t('chart.progress')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.task.id}>
                    <TableCell>{row.task.label}</TableCell>
                    <TableCell>{dateText(row.from)}</TableCell>
                    <TableCell>{dateText(row.to)}</TableCell>
                    <TableCell>{Math.max(0, Math.min(100, row.task.progress ?? 0))}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </figure>
    </StyleProvider>
  );
}
