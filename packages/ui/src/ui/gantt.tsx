import * as React from 'react';
import { Temporal } from 'temporal-polyfill';
import { useVirtualizer, observeElementRect } from '@tanstack/react-virtual';
import { Button, EmptyState } from './primitives';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './forms';
import {
  useDirection,
  useStyles,
  DirectionProvider,
  StyleProvider,
  type PlainStyleProps,
} from './styling';
import { dateFormatter, useTranslation } from './i18n';
import { useMotionSettings } from './motion-policy';
import { useGanttDrag } from './gantt-drag';
import { GanttBar } from './gantt-task';
import { GanttDataTable } from './gantt-table';
import {
  ganttRange,
  ganttNumber,
  ganttDate,
  ganttTicks,
  ganttPeriods,
  ganttLayout,
  ganttDependency,
  type GanttScale,
} from './gantt-model';
export { ganttRange } from './gantt-model';
export type { GanttScale } from './gantt-model';

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
  scale?: GanttScale;
  defaultScale?: GanttScale;
  onScaleChange?: (scale: GanttScale) => void;
  dayWidth?: number;
  rowHeight?: number;
  barHeight?: number;
  /** Fixed task-label width; omitted widths adapt to the chart's own viewport. */
  labelWidth?: number;
  height?: number;
  /** Padding in days is applied only to automatically derived range edges. */
  rangePadding?: number;
  /** ISO weekday: Monday=1 through Sunday=7. */
  weekStartsOn?: number;
  weekendDays?: readonly number[];
  highlightWeekends?: boolean;
  showTaskList?: boolean;
  labelPosition?: 'auto' | 'inside' | 'outside' | 'hidden';
  showToolbar?: boolean;
  toolbarActions?: React.ReactNode;
  showToday?: boolean;
  showTodayButton?: boolean;
  /** Date-only override for deterministic snapshots, SSR, or a business date. */
  today?: string;
  showTaskDetails?: boolean;
  renderTaskDetails?: (task: GanttTask<T>) => React.ReactNode;
  /** Pointer edits require onTaskChange; dates remain application-owned. */
  draggable?: boolean;
  resizable?: boolean;
  snapDays?: number;
  onTaskClick?: (task: GanttTask<T>) => void;
  onTaskChange?: (task: GanttTask<T>, previous: GanttTask<T>, reason: 'move' | 'resize') => void;
  renderTask?: (task: GanttTask<T>) => React.ReactNode;
  renderLabel?: (task: GanttTask<T>) => React.ReactNode;
  dataTable?: 'visible' | 'sr-only' | false;
  label?: string;
  loading?: boolean;
  showDependencies?: boolean;
}
const HEADER_HEIGHT = 72;
const stableStyleOverrides = {};
const useLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
const observeViewport: typeof observeElementRect<HTMLDivElement> = (instance, callback) =>
  observeElementRect(instance, (rect) =>
    callback({
      width: instance.scrollElement?.clientWidth ?? rect.width,
      height: instance.scrollElement?.clientHeight ?? rect.height,
    }),
  );
const defaultWeekends = [6, 7];
function todayDate(zone?: string) {
  try {
    return Temporal.Now.plainDateISO(zone);
  } catch {
    return Temporal.Now.plainDateISO();
  }
}
export function GanttChart<T>({
  tasks,
  start,
  end,
  scale: controlledScale,
  defaultScale = 'day',
  onScaleChange,
  dayWidth,
  rowHeight = 48,
  barHeight = 28,
  labelWidth: fixedLabelWidth,
  height = 400,
  rangePadding = 3,
  weekStartsOn = 1,
  weekendDays = defaultWeekends,
  highlightWeekends = true,
  showTaskList = true,
  labelPosition = 'auto',
  showToolbar = true,
  toolbarActions,
  showToday = true,
  showTodayButton = true,
  today,
  showTaskDetails = true,
  renderTaskDetails,
  draggable = true,
  resizable = true,
  snapDays = 1,
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
  const styles = useStyles(),
    { t, locale, timeZone } = useTranslation(),
    motion = useMotionSettings();
  const direction = useDirection(dir === 'ltr' || dir === 'rtl' ? dir : undefined);
  const viewport = React.useRef<HTMLDivElement>(null);
  const [localScale, setLocalScale] = React.useState(defaultScale);
  const scale = controlledScale ?? localScale;
  const basePx = ganttNumber(dayWidth, scale === 'month' ? 6 : scale === 'week' ? 16 : 40, 4, 240);
  const rh = ganttNumber(rowHeight, 48, 36),
    viewHeight = ganttNumber(height, 400, 160);
  const bh = ganttNumber(barHeight, 28, 16, rh - 8);
  const id = React.useId(),
    instructions = `${id}-instructions`,
    arrow = `${id.replace(/:/g, '')}-arrow`;
  const [announcement, announce] = React.useState('');
  const commit: GanttChartProps<T>['onTaskChange'] = onTaskChange
    ? (next, previous, reason) => {
        onTaskChange(next, previous, reason);
        announce(t('gantt.updated', { label: next.label, start: next.start, end: next.end }));
      }
    : undefined;
  const rows = React.useMemo(
    () =>
      tasks.flatMap((task) => {
        const dates = ganttRange(task.start, task.end);
        return dates ? [{ task, ...dates }] : [];
      }),
    [tasks],
  );
  const byId = React.useMemo(() => new Map(rows.map((row) => [row.task.id, row])), [rows]);
  const range = React.useMemo(() => {
    if (!rows.length) return undefined;
    const first = rows.reduce(
      (date, row) => (Temporal.PlainDate.compare(row.from, date) < 0 ? row.from : date),
      rows[0].from,
    );
    const last = rows.reduce(
      (date, row) => (Temporal.PlainDate.compare(row.to, date) > 0 ? row.to : date),
      rows[0].to,
    );
    const padding = Math.round(ganttNumber(rangePadding, 3, 0, 365));
    try {
      return ganttRange(
        start ?? first.subtract({ days: padding }).toString(),
        end ?? last.add({ days: padding }).toString(),
      );
    } catch {
      return undefined;
    }
  }, [rows, start, end, rangePadding]);
  const days = range?.days ?? 0;
  const getRowKey = React.useCallback((index: number) => rows[index].task.id, [rows]);
  const estimateRow = React.useCallback(() => rh, [rh]);
  const virtual = useVirtualizer({
    count: rows.length,
    getScrollElement: () => viewport.current,
    observeElementRect: observeViewport,
    estimateSize: estimateRow,
    overscan: 5,
    scrollMargin: HEADER_HEIGHT,
    initialRect: { height: viewHeight, width: 800 },
    getItemKey: getRowKey,
  });
  const items = virtual.getVirtualItems();
  const labelWidth = showTaskList
    ? ganttNumber(
        fixedLabelWidth,
        Math.round(Math.min(184, Math.max(96, (virtual.scrollRect?.width ?? 800) * 0.38))),
        48,
      )
    : 0;
  const availableWidth = Math.max(0, (virtual.scrollRect?.width ?? 800) - labelWidth);
  const px = dayWidth === undefined && days ? Math.max(basePx, availableWidth / days) : basePx;
  const width = days * px;
  const drag = useGanttDrag(
    viewport,
    px,
    direction,
    Math.round(ganttNumber(snapDays, 1, 1, 365)),
    commit,
  );
  const ticks = React.useMemo(
    () => (range ? ganttTicks(range, scale, Math.round(ganttNumber(weekStartsOn, 1, 1, 7))) : []),
    [range, scale, weekStartsOn],
  );
  const periods = React.useMemo(() => (range ? ganttPeriods(range, scale) : []), [range, scale]);
  const getTickKey = React.useCallback((index: number) => ticks[index].index, [ticks]);
  const estimateTick = React.useCallback(
    (index: number) => (ticks[index].end - ticks[index].index) * px,
    [ticks, px],
  );
  const axis = useVirtualizer({
    horizontal: true,
    observeElementRect: observeViewport,
    count: ticks.length,
    getScrollElement: () => viewport.current,
    estimateSize: estimateTick,
    overscan: 3,
    initialRect: { height: viewHeight, width: 800 },
    paddingStart: labelWidth,
    getItemKey: getTickKey,
    isRtl: direction === 'rtl',
  });
  const axisItems = axis.getVirtualItems();
  const visibleStart = ticks[axisItems[0]?.index ?? 0]?.index ?? 0;
  const visibleEnd = ticks[axisItems.at(-1)?.index ?? 0]?.end ?? days;
  const anchor = React.useRef<number | undefined>(undefined),
    previousPx = React.useRef(px);
  useLayoutEffect(() => {
    virtual.measure();
  }, [rh, virtual]);
  useLayoutEffect(() => {
    axis.measure();
  }, [px, axis]);
  useLayoutEffect(() => {
    if (previousPx.current !== px && anchor.current !== undefined) {
      const space = (viewport.current?.clientWidth ?? 800) - labelWidth;
      axis.scrollToOffset(Math.max(0, anchor.current * px - space / 2));
      anchor.current = undefined;
    }
    previousPx.current = px;
  }, [px, axis, labelWidth]);
  const changeScale = (next: string) => {
    if (next !== 'day' && next !== 'week' && next !== 'month') return;
    const space = (viewport.current?.clientWidth ?? 800) - labelWidth;
    anchor.current = width <= space ? days / 2 : ((axis.scrollOffset ?? 0) + space / 2) / px;
    if (controlledScale === undefined) setLocalScale(next);
    onScaleChange?.(next);
  };
  const currentDay = React.useMemo(() => {
    try {
      return today ? Temporal.PlainDate.from(today) : todayDate(timeZone);
    } catch {
      return undefined;
    }
  }, [today, timeZone]);
  const todayIndex = currentDay && range ? range.from.until(currentDay).days : -1;
  const todayInRange = todayIndex >= 0 && todayIndex < days;
  const dateText = (date: Temporal.PlainDate) =>
    dateFormatter(locale, {
      calendar: 'gregory',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(ganttDate(date));
  const shortDate = (date: Temporal.PlainDate, options: Intl.DateTimeFormatOptions) =>
    dateFormatter(locale, { calendar: 'gregory', ...options, timeZone: 'UTC' }).format(
      ganttDate(date),
    );
  const displayRow = (row: (typeof rows)[number]) => {
    if (drag.preview?.id !== row.task.id) return row;
    return { ...row, ...ganttRange(drag.preview.start, drag.preview.end)! };
  };
  const layout = (row: (typeof rows)[number]) =>
    range ? ganttLayout(displayRow(row), range, px) : { left: 0, width: 0 };
  const visibleIds = new Map(items.map((item) => [rows[item.index].task.id, item]));
  const weekendBackground = React.useMemo(() => {
    if (!range || !highlightWeekends) return undefined;
    return [...new Set(weekendDays)]
      .filter((day) => day >= 1 && day <= 7)
      .map((day) => {
        const offset = ((day - range.from.dayOfWeek + 7) % 7) * px;
        return `repeating-linear-gradient(to ${direction === 'rtl' ? 'left' : 'right'}, transparent 0 ${offset}px, var(--ui-gantt-weekend,var(--ui-muted)) ${offset}px ${offset + px}px, transparent ${offset + px}px ${px * 7}px)`;
      })
      .join(', ');
  }, [range, highlightWeekends, weekendDays, direction, px]);
  const tickBackground = `repeating-linear-gradient(to ${direction === 'rtl' ? 'left' : 'right'}, transparent 0 ${px - 1}px, var(--ui-border) ${px - 1}px ${px}px)`;
  return (
    <DirectionProvider dir={direction}>
      <StyleProvider unstyled={unstyled} styles={stableStyleOverrides}>
        {styles.tooltip(
          <figure
            aria-label={label ?? t('chart.gantt')}
            aria-busy={loading || undefined}
            dir={direction}
            {...styles('gantt.root', 'ui-gantt', className, unstyled)}
            data-dragging={!!drag.preview || undefined}
            {...props}
          >
            <span id={instructions} className="ui-visually-hidden">
              {t('gantt.instructions')}
            </span>
            <span role="status" aria-live="polite" className="ui-visually-hidden">
              {announcement}
            </span>
            {loading || !rows.length || !range ? (
              <EmptyState icon={null} title={t(loading ? 'chart.loading' : 'chart.empty')} />
            ) : (
              <>
                {showToolbar && (
                  <div {...styles('gantt.toolbar', 'ui-gantt-toolbar', undefined, unstyled)}>
                    <span
                      {...styles('gantt.range-label', 'ui-gantt-range-label', undefined, unstyled)}
                    >
                      {dateText(range.from)} – {dateText(range.to.subtract({ days: 1 }))}
                    </span>
                    <div
                      {...styles(
                        'gantt.toolbar-actions',
                        'ui-gantt-toolbar-actions',
                        undefined,
                        unstyled,
                      )}
                    >
                      {toolbarActions}
                      {showTodayButton && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!todayInRange}
                          title={!todayInRange ? t('gantt.todayOutside') : undefined}
                          onClick={() =>
                            axis.scrollToOffset(
                              Math.max(
                                0,
                                todayIndex * px -
                                  ((viewport.current?.clientWidth ?? 800) - labelWidth) / 2,
                              ),
                              { behavior: motion.reduced ? 'auto' : 'smooth' },
                            )
                          }
                        >
                          {t('calendar.today')}
                        </Button>
                      )}
                      <Select value={scale} onValueChange={changeScale}>
                        <SelectTrigger aria-label={t('gantt.view')}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(['day', 'week', 'month'] as const).map((view) => (
                            <SelectItem key={view} value={view}>
                              {t(`calendar.${view}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <div
                  ref={viewport}
                  role="region"
                  tabIndex={0}
                  aria-label={t('table.scrollArea', { label: label ?? t('chart.gantt') })}
                  {...styles('gantt.viewport', 'ui-gantt-scroll', undefined, unstyled)}
                  style={
                    {
                      height: viewHeight,
                      '--ui-gantt-label-width': `${labelWidth}px`,
                      '--ui-gantt-width': `${width}px`,
                      '--ui-gantt-bar-height': `${bh}px`,
                      '--ui-gantt-day-width': `${px}px`,
                    } as React.CSSProperties
                  }
                >
                  <div {...styles('gantt.header', 'ui-gantt-header', undefined, unstyled)}>
                    {showTaskList && <strong>{t('chart.task')}</strong>}
                    <div {...styles('gantt.axis', 'ui-gantt-axis', undefined, unstyled)}>
                      {periods
                        .filter((period) => period.end > visibleStart && period.index < visibleEnd)
                        .map((period) => (
                          <span
                            {...styles('gantt.period', 'ui-gantt-period', undefined, unstyled)}
                            key={period.index}
                            style={{
                              insetInlineStart: period.index * px,
                              width: (period.end - period.index) * px,
                            }}
                          >
                            <span>
                              {shortDate(
                                period.date,
                                scale === 'month'
                                  ? { year: 'numeric' }
                                  : { month: 'long', year: 'numeric' },
                              )}
                            </span>
                          </span>
                        ))}
                      {axisItems.map((item) => {
                        const tick = ticks[item.index],
                          isToday =
                            todayInRange && todayIndex >= tick.index && todayIndex < tick.end;
                        return (
                          <span
                            {...styles('gantt.tick', 'ui-gantt-tick', undefined, unstyled)}
                            key={tick.index}
                            data-today={(showToday && isToday) || undefined}
                            data-weekend={
                              (scale === 'day' &&
                                highlightWeekends &&
                                weekendDays.includes(tick.date.dayOfWeek)) ||
                              undefined
                            }
                            title={dateText(tick.date)}
                            style={{ insetInlineStart: tick.index * px, width: item.size }}
                          >
                            {scale === 'day' && (
                              <small>{shortDate(tick.date, { weekday: 'narrow' })}</small>
                            )}
                            <span>
                              {shortDate(
                                tick.date,
                                scale === 'month' ? { month: 'short' } : { day: '2-digit' },
                              )}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div
                    {...styles('gantt.body', 'ui-gantt-body', undefined, unstyled)}
                    style={{ height: virtual.getTotalSize(), width: width + labelWidth }}
                  >
                    <div
                      {...styles('gantt.grid', 'ui-gantt-grid', undefined, unstyled)}
                      style={{
                        insetInlineStart: labelWidth,
                        width,
                        backgroundImage: [
                          scale === 'day' ? tickBackground : undefined,
                          weekendBackground,
                        ]
                          .filter(Boolean)
                          .join(', '),
                      }}
                      aria-hidden="true"
                    />
                    {showToday && todayInRange && (
                      <div
                        {...styles('gantt.today', 'ui-gantt-today', undefined, unstyled)}
                        style={{ insetInlineStart: labelWidth + (todayIndex + 0.5) * px }}
                        aria-hidden="true"
                      />
                    )}
                    {items.map((item) => {
                      const row = rows[item.index],
                        position = layout(row);
                      return (
                        <div
                          {...styles('gantt.row', 'ui-gantt-row', undefined, unstyled)}
                          key={row.task.id}
                          style={{
                            height: rh,
                            transform: `translateY(${item.start - HEADER_HEIGHT}px)`,
                          }}
                        >
                          {showTaskList && (
                            <div
                              {...styles('gantt.label', 'ui-gantt-label', undefined, unstyled)}
                              title={row.task.label}
                            >
                              <div
                                {...styles(
                                  'gantt.label-content',
                                  'ui-gantt-label-content',
                                  undefined,
                                  unstyled,
                                )}
                              >
                                {renderLabel?.(row.task) ?? row.task.label}
                              </div>
                            </div>
                          )}
                          <div {...styles('gantt.lane', 'ui-gantt-lane', undefined, unstyled)}>
                            {position.width > 0 && (
                              <GanttBar
                                task={row.task}
                                position={position}
                                dateText={dateText}
                                instructions={instructions}
                                drag={drag}
                                onEdit={commit}
                                onTaskClick={onTaskClick}
                                renderTask={renderTask}
                                renderTaskDetails={renderTaskDetails}
                                showTaskDetails={showTaskDetails}
                                draggable={draggable}
                                resizable={resizable}
                                labelPosition={labelPosition}
                                dependencies={(row.task.dependencies ?? []).flatMap((id) =>
                                  byId.has(id) ? [byId.get(id)!.task.label] : [],
                                )}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {showDependencies && (
                      <svg
                        {...styles(
                          'gantt.dependencies',
                          'ui-gantt-dependencies',
                          undefined,
                          unstyled,
                        )}
                        style={{ insetInlineStart: labelWidth }}
                        width={width}
                        height={virtual.getTotalSize()}
                        aria-hidden="true"
                      >
                        <defs>
                          <marker
                            id={arrow}
                            markerWidth="7"
                            markerHeight="7"
                            refX="6"
                            refY="3.5"
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                          >
                            <path className="ui-gantt-arrowhead" d="M 0 0 L 6 3.5 L 0 7" />
                          </marker>
                        </defs>
                        <g
                          transform={
                            direction === 'rtl' ? `translate(${width} 0) scale(-1 1)` : undefined
                          }
                        >
                          {items.flatMap((item) => {
                            const row = rows[item.index],
                              target = layout(row);
                            return (row.task.dependencies ?? []).flatMap((dependency) => {
                              const sourceItem = visibleIds.get(dependency);
                              if (!sourceItem || dependency === row.task.id || !target.width)
                                return [];
                              const source = layout(rows[sourceItem.index]);
                              if (!source.width) return [];
                              return (
                                <path
                                  key={`${dependency}:${row.task.id}`}
                                  data-source={dependency}
                                  data-target={row.task.id}
                                  markerEnd={`url(#${arrow})`}
                                  d={ganttDependency(
                                    source.left + source.width + 1,
                                    sourceItem.start - HEADER_HEIGHT + rh / 2,
                                    target.left - 4,
                                    item.start - HEADER_HEIGHT + rh / 2,
                                    rh,
                                  )}
                                />
                              );
                            });
                          })}
                        </g>
                      </svg>
                    )}
                  </div>
                </div>
              </>
            )}
            {dataTable !== false && (
              <GanttDataTable rows={rows} label={label} presentation={dataTable} />
            )}
          </figure>,
          unstyled,
        )}
      </StyleProvider>
    </DirectionProvider>
  );
}
