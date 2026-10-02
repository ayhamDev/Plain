import * as React from 'react';
import { createPortal } from 'react-dom';
import { Temporal } from 'temporal-polyfill';
import { ChevronLeft, ChevronRight, Printer, Plus } from 'lucide-react';
import { dateFormatter, useTranslation } from './i18n';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './table';
import { Button, EmptyState } from './primitives';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './forms';
import { StyleProvider, useDirection, useStyles, type PlainStyleProps } from './styling';
import { lightTokens, componentTokenAliases, tokensToStyle } from './token-contract';
import {
  calendarDay,
  calendarZone,
  calendarRange,
  eventSpan,
  eventsInRange,
  eventColumns,
  moveCalendarEvent,
  resizeCalendarEvent,
  startOfWeek,
  type CalendarDate,
  type CalendarRange,
  type CalendarEventSpan,
  type FullCalendarEvent,
  type FullCalendarView,
} from './calendar-model';

export type {
  CalendarDate,
  CalendarRange,
  FullCalendarEvent,
  FullCalendarView,
} from './calendar-model';
export interface CalendarSelection extends CalendarRange {
  allDay: boolean;
  view: FullCalendarView;
}
export interface CalendarEventChange<T = Record<string, unknown>> {
  event: FullCalendarEvent<T>;
  previous: FullCalendarEvent<T>;
  reason: 'move' | 'resize';
}
export interface CalendarRenderContext<T = Record<string, unknown>> {
  event: FullCalendarEvent<T>;
  date: string;
  view: FullCalendarView;
  timeText: string;
  continuation: boolean;
}
export interface CalendarPrintContext<T = Record<string, unknown>> {
  date: string;
  range: CalendarRange;
  view: FullCalendarView;
  title: string;
  events: readonly FullCalendarEvent<T>[];
  allEvents: readonly FullCalendarEvent<T>[];
  timeZone: string;
}
export interface FullCalendarApi {
  getDate(): string;
  getView(): FullCalendarView;
  getRange(): CalendarRange;
  gotoDate(date: CalendarDate): void;
  changeView(view: FullCalendarView): void;
  prev(): void;
  next(): void;
  today(): void;
  print(): void;
}
export interface FullCalendarRef {
  getApi(): FullCalendarApi;
}
export interface FullCalendarProps<T = Record<string, unknown>>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'>, PlainStyleProps {
  events?: readonly FullCalendarEvent<T>[];
  date?: CalendarDate;
  defaultDate?: CalendarDate;
  view?: FullCalendarView;
  defaultView?: FullCalendarView;
  views?: readonly FullCalendarView[];
  onDateChange?: (date: string) => void;
  onViewChange?: (view: FullCalendarView) => void;
  onRangeChange?: (range: CalendarRange & { view: FullCalendarView }) => void;
  onDateClick?: (date: string) => void;
  onEventClick?: (event: FullCalendarEvent<T>, context: CalendarRenderContext<T>) => void;
  onSlotSelect?: (selection: CalendarSelection) => void;
  onEventChange?: (change: CalendarEventChange<T>) => void;
  onEventsChange?: (events: FullCalendarEvent<T>[]) => void;
  selectable?: boolean;
  editable?: boolean;
  disabled?: boolean;
  locale?: string;
  timeZone?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  mobileBreakpoint?: number;
  dayStart?: number;
  dayEnd?: number;
  slotMinutes?: number;
  maxEventsPerDay?: number;
  height?: number | string;
  toolbar?:
    React.ReactNode | ((api: FullCalendarApi, context: CalendarPrintContext<T>) => React.ReactNode);
  toolbarActions?: React.ReactNode;
  renderEvent?: (context: CalendarRenderContext<T>) => React.ReactNode;
  renderDay?: (date: string, events: readonly FullCalendarEvent<T>[]) => React.ReactNode;
  renderEmpty?: React.ReactNode;
  printable?: boolean;
  printMode?: 'agenda' | 'calendar';
  printHeader?: React.ReactNode;
  printFooter?: React.ReactNode;
  printProps?: React.HTMLAttributes<HTMLDivElement>;
  renderPrint?: (context: CalendarPrintContext<T>) => React.ReactNode;
  /** Replaces browser printing; use this for PDF/export/services. */
  onPrint?: (context: CalendarPrintContext<T>) => void | Promise<void>;
  labels?: Partial<
    Record<
      | FullCalendarView
      | 'today'
      | 'previous'
      | 'next'
      | 'print'
      | 'noEvents'
      | 'allDay'
      | 'more'
      | 'addEvent',
      string
    >
  >;
  containerRef?: React.Ref<HTMLDivElement>;
}
export type FullCalendarOptions<T = Record<string, unknown>> = FullCalendarProps<T>;

function dateLabel(
  date: Temporal.PlainDate,
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
) {
  const value = new Date(0);
  value.setUTCFullYear(date.year, date.month - 1, date.day);
  return dateFormatter(locale, { ...options, timeZone: 'UTC' }).format(value);
}
function hourLabel(hour: number, locale?: string) {
  return dateFormatter(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(
    Date.UTC(2000, 0, 1, hour % 24),
  );
}
function wallLabel(
  value: { year: number; month: number; day: number; hour: number; minute: number },
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
) {
  const date = new Date(0);
  date.setUTCFullYear(value.year, value.month - 1, value.day);
  date.setUTCHours(value.hour, value.minute);
  return dateFormatter(locale, { ...options, timeZone: 'UTC' }).format(date);
}

function CalendarComponent<T = Record<string, unknown>>(
  allProps: FullCalendarProps<T>,
  forwardedRef: React.ForwardedRef<FullCalendarRef>,
) {
  const {
    events = [],
    date,
    defaultDate,
    view,
    defaultView = 'month',
    views = ['month', 'week', 'day', 'agenda'],
    onDateChange,
    onViewChange,
    onRangeChange,
    onDateClick,
    onEventClick,
    onSlotSelect,
    onEventChange,
    onEventsChange,
    selectable = false,
    editable = false,
    disabled = false,
    locale: localeProp,
    timeZone: zoneProp,
    weekStartsOn = 0,
    mobileBreakpoint = 640,
    dayStart = 7,
    dayEnd = 21,
    slotMinutes = 30,
    maxEventsPerDay = 3,
    height,
    toolbar,
    toolbarActions,
    renderEvent,
    renderDay,
    renderEmpty,
    printable = true,
    printMode = 'agenda',
    printHeader,
    printFooter,
    printProps,
    renderPrint,
    onPrint,
    labels = {},
    containerRef,
    className,
    unstyled,
    style,
    dir,
    ...props
  } = allProps;
  const language = useTranslation();
  const { t } = language;
  const locale = localeProp ?? language.locale;
  const timeZone = zoneProp ?? language.timeZone ?? 'local';
  const styles = useStyles(),
    direction = useDirection(dir === 'rtl' || dir === 'ltr' ? dir : undefined);
  const root = React.useRef<HTMLDivElement>(null);
  const [localDate, setLocalDate] = React.useState(() =>
    calendarDay(
      defaultDate ?? Temporal.Now.plainDateISO(calendarZone(timeZone)).toString(),
      timeZone,
    ).toString(),
  );
  const [localView, setLocalView] = React.useState(defaultView);
  const focused = calendarDay(date ?? localDate, timeZone);
  const activeView = view ?? localView;
  const focusedDay = focused.toString();
  const range = React.useMemo(
    () => calendarRange(Temporal.PlainDate.from(focusedDay), activeView, weekStartsOn),
    [focusedDay, activeView, weekStartsOn],
  );
  const [compact, setCompact] = React.useState(false);
  const [chosen, setChosen] = React.useState(focused.toString());
  const [expandedDay, setExpandedDay] = React.useState<string>();
  const [anchor, setAnchor] = React.useState<string>();
  const [slotFocus, setSlotFocus] = React.useState<{ day: string; minute: number }>();
  const slotAnchor = React.useRef<string | undefined>(undefined);
  const [printSnapshot, setPrintSnapshot] = React.useState<CalendarPrintContext<T>>();
  const pendingFocus = React.useRef<string | undefined>(undefined);
  const spans = React.useMemo(
    () =>
      events
        .map((event) => eventSpan(event, timeZone))
        .filter((s): s is CalendarEventSpan<T> => !!s),
    [events, timeZone],
  );
  const visible = React.useMemo(() => eventsInRange(spans, range), [spans, range]);
  const today = Temporal.Now.plainDateISO(calendarZone(timeZone)).toString();
  const title =
    activeView === 'month'
      ? dateLabel(focused, locale, { month: 'long', year: 'numeric' })
      : activeView === 'day'
        ? dateLabel(focused, locale, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : `${dateLabel(Temporal.PlainDate.from(range.start), locale, { month: 'short', day: 'numeric' })} - ${dateLabel(Temporal.PlainDate.from(range.end).subtract({ days: 1 }), locale, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const context: CalendarPrintContext<T> = {
    date: focused.toString(),
    range,
    view: activeView,
    title,
    events: visible.map((s) => s.event),
    allEvents: events,
    timeZone: calendarZone(timeZone),
  };
  const go = (value: CalendarDate) => {
    if (disabled) return;
    const next = calendarDay(value, timeZone).toString();
    if (date === undefined) setLocalDate(next);
    setChosen(next);
    setExpandedDay(undefined);
    onDateChange?.(next);
  };
  const changeView = (next: FullCalendarView) => {
    if (disabled || !views.includes(next)) return;
    if (view === undefined) setLocalView(next);
    onViewChange?.(next);
    setExpandedDay(undefined);
  };
  const navigate = (step: number) =>
    go(
      focused
        .add(
          activeView === 'month'
            ? { months: step }
            : { days: step * (activeView === 'day' ? 1 : 7) },
        )
        .toString(),
    );
  const print = () => {
    if (disabled) return;
    if (onPrint) {
      void onPrint(context);
      return;
    }
    setPrintSnapshot(context);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        try {
          window.print();
        } finally {
          setPrintSnapshot(undefined);
        }
      }),
    );
  };
  const api: FullCalendarApi = {
    getDate: () => focused.toString(),
    getView: () => activeView,
    getRange: () => range,
    gotoDate: go,
    changeView,
    prev: () => navigate(-1),
    next: () => navigate(1),
    today: () => go(today),
    print,
  };
  React.useImperativeHandle(forwardedRef, () => ({ getApi: () => api }));
  const rangeHandler = React.useRef(onRangeChange);
  React.useEffect(() => {
    rangeHandler.current = onRangeChange;
  }, [onRangeChange]);
  React.useEffect(() => {
    rangeHandler.current?.({ ...range, view: activeView });
  }, [range, activeView]);
  React.useEffect(() => {
    setChosen(focusedDay);
  }, [focusedDay]);
  React.useEffect(() => {
    const element = root.current;
    if (!element) return;
    const update = () => {
      if (element.clientWidth > 0)
        setCompact(element.clientWidth < Math.max(280, mobileBreakpoint));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [mobileBreakpoint]);
  React.useEffect(() => {
    if (!pendingFocus.current) return;
    const button = root.current?.querySelector<HTMLButtonElement>(
      `[data-calendar-date="${pendingFocus.current}"]`,
    );
    if (button) {
      button.focus();
      pendingFocus.current = undefined;
    }
  });
  const first =
    activeView === 'month'
      ? startOfWeek(focused.with({ day: 1 }), weekStartsOn)
      : Temporal.PlainDate.from(range.start);
  const count =
    activeView === 'month'
      ? Math.ceil((focused.daysInMonth + focused.with({ day: 1 }).since(first).days) / 7) * 7
      : activeView === 'day'
        ? 1
        : 7;
  const firstDay = first.toString();
  const days = React.useMemo(() => {
    const first = Temporal.PlainDate.from(firstDay);
    return Array.from({ length: count }, (_, i) => first.add({ days: i }));
  }, [firstDay, count]);
  const indexedEvents = React.useMemo(() => {
    const index = new Map<string, CalendarEventSpan<T>[]>();
    const lower = Temporal.PlainDate.from(firstDay),
      upper = lower.add({ days: count });
    for (const span of spans) {
      let day = span.start.toPlainDate();
      if (Temporal.PlainDate.compare(day, lower) < 0) day = lower;
      const end = span.end.toPlainTime().equals('00:00')
        ? span.end.toPlainDate().subtract({ days: 1 })
        : span.end.toPlainDate();
      while (
        Temporal.PlainDate.compare(day, upper) < 0 &&
        Temporal.PlainDate.compare(day, end) <= 0
      ) {
        const key = day.toString(),
          items = index.get(key) ?? [];
        items.push(span);
        index.set(key, items);
        day = day.add({ days: 1 });
      }
    }
    for (const items of index.values())
      items.sort(
        (a, b) =>
          Number(b.allDay) - Number(a.allDay) || Temporal.PlainDateTime.compare(a.start, b.start),
      );
    return index;
  }, [spans, firstDay, count]);
  const eventsForDay = (day: Temporal.PlainDate) => indexedEvents.get(day.toString()) ?? [];
  const dayRange = (day: Temporal.PlainDate) => ({
    start: day.toString(),
    end: day.add({ days: 1 }).toString(),
  });
  const chooseDay = (day: Temporal.PlainDate, shift = false) => {
    setChosen(day.toString());
    onDateClick?.(day.toString());
    if (selectable && onSlotSelect) {
      const from = shift && anchor ? Temporal.PlainDate.from(anchor) : day;
      const before = Temporal.PlainDate.compare(from, day) <= 0;
      onSlotSelect({
        start: (before ? from : day).toString(),
        end: (before ? day : from).add({ days: 1 }).toString(),
        allDay: true,
        view: activeView,
      });
      if (!shift) setAnchor(day.toString());
    }
  };
  const keyboardDay = (event: React.KeyboardEvent, day: Temporal.PlainDate) => {
    const keys: Record<string, { days?: number; months?: number }> = {
      ArrowLeft: { days: direction === 'rtl' ? 1 : -1 },
      ArrowRight: { days: direction === 'rtl' ? -1 : 1 },
      ArrowUp: { days: -7 },
      ArrowDown: { days: 7 },
      Home: { days: -(((day.dayOfWeek % 7) - weekStartsOn + 7) % 7) },
      End: { days: 6 - (((day.dayOfWeek % 7) - weekStartsOn + 7) % 7) },
      PageUp: { months: -1 },
      PageDown: { months: 1 },
    };
    if (!keys[event.key]) return;
    event.preventDefault();
    const next = day.add(keys[event.key]);
    setChosen(next.toString());
    pendingFocus.current = next.toString();
    if (!days.some((d) => d.equals(next))) go(next.toString());
  };
  const canEdit = (span: CalendarEventSpan<T>) =>
    editable && span.event.editable !== false && !!(onEventsChange || onEventChange) && !disabled;
  const updateEvent = (
    span: CalendarEventSpan<T>,
    updated: FullCalendarEvent<T>,
    reason: 'move' | 'resize',
  ) => {
    if (!canEdit(span)) return;
    onEventChange?.({ event: updated, previous: span.event, reason });
    onEventsChange?.(events.map((event) => (event.id === updated.id ? updated : event)));
  };
  const drop = (event: React.DragEvent, day: Temporal.PlainDate, minute?: number) => {
    const id = event.dataTransfer.getData('application/x-p-ui-event');
    const span = spans.find((s) => s.event.id === id);
    if (!span || !canEdit(span)) return;
    event.preventDefault();
    const delta = day.since(span.start.toPlainDate()).days;
    updateEvent(
      span,
      moveCalendarEvent(
        span,
        {
          days: delta,
          minutes:
            minute === undefined || span.allDay
              ? 0
              : minute - span.start.hour * 60 - span.start.minute,
        },
        timeZone,
      ),
      'move',
    );
  };
  const eventButton = (
    span: CalendarEventSpan<T>,
    day: Temporal.PlainDate,
    extraStyle?: React.CSSProperties,
    timed = false,
  ) => {
    const timeText = span.allDay
      ? (labels.allDay ?? t('calendar.allDay'))
      : wallLabel(span.start, locale, { hour: 'numeric', minute: '2-digit' });
    const renderContext: CalendarRenderContext<T> = {
      event: span.event,
      date: day.toString(),
      view: activeView,
      timeText,
      continuation: !span.start.toPlainDate().equals(day),
    };
    return (
      <button
        key={span.event.id}
        type="button"
        disabled={disabled}
        draggable={canEdit(span)}
        {...styles('full-calendar.event', 'ui-calendar-event', undefined, unstyled)}
        data-timed={timed || undefined}
        style={
          {
            '--ui-calendar-event-color': span.event.color ?? 'var(--ui-accent)',
            ...extraStyle,
          } as React.CSSProperties
        }
        title={`${span.event.title} · ${timeText}`}
        aria-label={`${span.event.title}, ${timeText}`}
        onClick={() => onEventClick?.(span.event, renderContext)}
        onDragStart={(event) => {
          event.dataTransfer.setData('application/x-p-ui-event', span.event.id);
          event.dataTransfer.effectAllowed = 'move';
        }}
        onKeyDown={(event) => {
          if (
            !event.altKey ||
            !canEdit(span) ||
            !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
          )
            return;
          event.preventDefault();
          const dayDelta =
            event.key === 'ArrowLeft'
              ? direction === 'rtl'
                ? 1
                : -1
              : event.key === 'ArrowRight'
                ? direction === 'rtl'
                  ? -1
                  : 1
                : 0;
          const vertical = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
          const duration = {
            days: dayDelta + (span.allDay ? vertical : 0),
            minutes: span.allDay ? 0 : vertical * slot,
          };
          const next = event.shiftKey
            ? resizeCalendarEvent(span, duration, timeZone)
            : moveCalendarEvent(span, duration, timeZone);
          if (eventSpan(next, timeZone))
            updateEvent(span, next, event.shiftKey ? 'resize' : 'move');
        }}
      >
        {renderEvent ? (
          renderEvent(renderContext)
        ) : (
          <>
            <span
              {...styles('full-calendar.event-dot', 'ui-calendar-event-dot', undefined, unstyled)}
              aria-hidden="true"
            />
            <span
              {...styles(
                'full-calendar.event-title',
                'ui-calendar-event-title',
                undefined,
                unstyled,
              )}
            >
              {span.event.title}
            </span>
            {!span.allDay && (
              <span
                {...styles(
                  'full-calendar.event-time',
                  'ui-calendar-event-time',
                  undefined,
                  unstyled,
                )}
              >
                {timeText}
              </span>
            )}
          </>
        )}
      </button>
    );
  };
  const agenda = (agendaDays: Temporal.PlainDate[]) => {
    const rows = agendaDays
      .map((day) => ({ day, entries: eventsForDay(day) }))
      .filter((row) => row.entries.length);
    return rows.length ? (
      <div {...styles('full-calendar.agenda', 'ui-calendar-agenda', undefined, unstyled)}>
        {rows.map(({ day, entries }) => (
          <section
            key={day.toString()}
            {...styles('full-calendar.agenda-day', 'ui-calendar-agenda-day', undefined, unstyled)}
          >
            <h3>
              <span>{dateLabel(day, locale, { weekday: 'short' })}</span>
              <time dateTime={day.toString()}>
                {dateLabel(day, locale, { day: 'numeric', month: 'short' })}
              </time>
            </h3>
            <ul>
              {entries.map((span) => (
                <li key={span.event.id}>
                  {eventButton(span, day)}
                  {span.event.end && !span.allDay && (
                    <span
                      {...styles(
                        'full-calendar.agenda-end',
                        'ui-calendar-agenda-end',
                        undefined,
                        unstyled,
                      )}
                    >
                      {wallLabel(span.end, locale, { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    ) : (
      (renderEmpty ?? (
        <EmptyState
          title={labels.noEvents ?? t('calendar.noEvents')}
          description={dateLabel(agendaDays[0] ?? focused, locale, { dateStyle: 'long' })}
        />
      ))
    );
  };
  const monthGrid = (printing = false) => (
    <div
      role="grid"
      aria-label={title}
      {...styles('full-calendar.month', 'ui-calendar-month', undefined, unstyled)}
    >
      <div
        role="row"
        {...styles('full-calendar.weekdays', 'ui-calendar-weekdays', undefined, unstyled)}
      >
        {days.slice(0, 7).map((day) => (
          <div role="columnheader" key={day.toString()}>
            {dateLabel(day, locale, { weekday: compact && !printing ? 'narrow' : 'short' })}
          </div>
        ))}
      </div>
      {Array.from({ length: count / 7 }, (_, week) => (
        <div
          role="row"
          {...styles('full-calendar.week-row', 'ui-calendar-week-row', undefined, unstyled)}
          key={week}
        >
          {days.slice(week * 7, week * 7 + 7).map((day) => {
            const items = eventsForDay(day);
            const iso = day.toString();
            return (
              <div
                role="gridcell"
                key={iso}
                {...styles('full-calendar.cell', 'ui-calendar-cell', undefined, unstyled)}
                data-outside={day.month !== focused.month || undefined}
                data-selected={iso === chosen || undefined}
                onDragOver={(event) => {
                  if (editable && !disabled) event.preventDefault();
                }}
                onDrop={(event) => drop(event, day)}
              >
                <button
                  type="button"
                  data-calendar-date={iso}
                  disabled={disabled}
                  tabIndex={iso === chosen ? 0 : -1}
                  aria-label={`${dateLabel(day, locale, { dateStyle: 'full' })}, ${t('calendar.eventCount', { count: items.length })}`}
                  aria-current={iso === today ? 'date' : undefined}
                  aria-pressed={iso === chosen}
                  {...styles(
                    'full-calendar.day-number',
                    'ui-calendar-day-number',
                    undefined,
                    unstyled,
                  )}
                  onKeyDown={(event) => keyboardDay(event, day)}
                  onClick={(event) => chooseDay(day, event.shiftKey)}
                >
                  {dateLabel(day, locale, { day: 'numeric' })}
                </button>
                {renderDay?.(
                  iso,
                  items.map((s) => s.event),
                )}
                {compact && !printing ? (
                  <span
                    {...styles(
                      'full-calendar.day-dots',
                      'ui-calendar-day-dots',
                      undefined,
                      unstyled,
                    )}
                    aria-hidden="true"
                  >
                    {items.slice(0, 3).map((span) => (
                      <i
                        key={span.event.id}
                        style={{ background: span.event.color ?? 'var(--ui-chart-1)' }}
                      />
                    ))}
                  </span>
                ) : (
                  <div
                    {...styles(
                      'full-calendar.cell-events',
                      'ui-calendar-cell-events',
                      undefined,
                      unstyled,
                    )}
                  >
                    {items
                      .slice(0, printing ? undefined : Math.max(1, maxEventsPerDay))
                      .map((span) => eventButton(span, day))}
                    {!printing && items.length > Math.max(1, maxEventsPerDay) && (
                      <button
                        type="button"
                        disabled={disabled}
                        {...styles('full-calendar.more', 'ui-calendar-more', undefined, unstyled)}
                        onClick={() => {
                          setExpandedDay(iso);
                          setChosen(iso);
                        }}
                      >
                        {labels.more ?? t('calendar.more')} +
                        {items.length - Math.max(1, maxEventsPerDay)}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
  const startHour = Number.isFinite(dayStart) ? Math.max(0, Math.min(23, Math.floor(dayStart))) : 7,
    endHour = Number.isFinite(dayEnd)
      ? Math.max(startHour + 1, Math.min(24, Math.floor(dayEnd)))
      : Math.max(startHour + 1, 21);
  const totalMinutes = (endHour - startHour) * 60,
    slot = Number.isFinite(slotMinutes) ? Math.max(5, Math.min(60, Math.floor(slotMinutes))) : 30;
  const scheduleDays = React.useMemo(
    () => (compact ? [Temporal.PlainDate.from(chosen)] : days),
    [compact, chosen, days],
  );
  const slotCount = Math.ceil(totalMinutes / slot);
  const slotDescriptions = React.useMemo(() => {
    const result = new Map<
      string,
      { minute: number; start: Temporal.PlainDateTime; label: string }[]
    >();
    if (activeView !== 'week' && activeView !== 'day') return result;
    for (const day of scheduleDays)
      result.set(
        day.toString(),
        Array.from({ length: slotCount }, (_, i) => {
          const minute = startHour * 60 + i * slot;
          const start = day.toPlainDateTime({ hour: Math.floor(minute / 60), minute: minute % 60 });
          return {
            minute,
            start,
            label: `${labels.addEvent ?? t('calendar.addEvent')}, ${wallLabel(start, locale, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`,
          };
        }),
      );
    return result;
  }, [activeView, scheduleDays, slotCount, startHour, slot, labels.addEvent, t, locale]);
  const focusDay =
    slotFocus && scheduleDays.some((day) => day.toString() === slotFocus.day)
      ? slotFocus.day
      : (scheduleDays.find((day) => day.toString() === chosen)?.toString() ??
        scheduleDays[0].toString());
  const focusMinute =
    slotFocus &&
    slotFocus.minute >= startHour * 60 &&
    slotFocus.minute < endHour * 60 &&
    (slotFocus.minute - startHour * 60) % slot === 0
      ? slotFocus.minute
      : startHour * 60;
  const selectSlot = (start: Temporal.PlainDateTime, shift: boolean) => {
    const from =
      shift && slotAnchor.current ? Temporal.PlainDateTime.from(slotAnchor.current) : start;
    const before = Temporal.PlainDateTime.compare(from, start) <= 0;
    onSlotSelect?.({
      start: (before ? from : start).toString(),
      end: (before ? start : from).add({ minutes: slot }).toString(),
      allDay: false,
      view: activeView,
    });
    if (!shift) slotAnchor.current = start.toString();
  };
  const keyboardSlot = (event: React.KeyboardEvent, dayIndex: number, index: number) => {
    let nextDay = dayIndex,
      nextIndex = index;
    if (event.key === 'ArrowUp') nextIndex--;
    else if (event.key === 'ArrowDown') nextIndex++;
    else if (event.key === 'ArrowLeft') nextDay += direction === 'rtl' ? 1 : -1;
    else if (event.key === 'ArrowRight') nextDay += direction === 'rtl' ? -1 : 1;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = slotCount - 1;
    else return;
    event.preventDefault();
    nextDay = Math.max(0, Math.min(scheduleDays.length - 1, nextDay));
    nextIndex = Math.max(0, Math.min(slotCount - 1, nextIndex));
    const day = scheduleDays[nextDay].toString(),
      minute = startHour * 60 + nextIndex * slot;
    setSlotFocus({ day, minute });
    root.current
      ?.querySelector<HTMLButtonElement>(`[data-calendar-slot="${day}T${minute}"]`)
      ?.focus();
  };
  const timeGrid = () => (
    <div
      {...styles('full-calendar.time-scroll', 'ui-calendar-time-scroll', undefined, unstyled)}
      style={height ? { maxHeight: height } : undefined}
    >
      <div
        {...styles('full-calendar.time-grid', 'ui-calendar-time-grid', undefined, unstyled)}
        style={
          {
            '--ui-calendar-days': scheduleDays.length,
            '--ui-calendar-hours': endHour - startHour,
          } as React.CSSProperties
        }
      >
        <div
          {...styles('full-calendar.time-corner', 'ui-calendar-time-corner', undefined, unstyled)}
        />
        {scheduleDays.map((day) => (
          <div
            {...styles('full-calendar.time-header', 'ui-calendar-time-header', undefined, unstyled)}
            key={day.toString()}
          >
            <span>{dateLabel(day, locale, { weekday: 'short' })}</span>
            <button
              type="button"
              disabled={disabled}
              {...styles('full-calendar.day-number', 'ui-calendar-day-number', undefined, unstyled)}
              aria-current={day.toString() === today ? 'date' : undefined}
              onClick={() => chooseDay(day)}
            >
              {dateLabel(day, locale, { day: 'numeric' })}
            </button>
          </div>
        ))}
        <div
          {...styles(
            'full-calendar.all-day-label',
            'ui-calendar-all-day-label',
            undefined,
            unstyled,
          )}
        >
          {labels.allDay ?? t('calendar.allDay')}
        </div>
        {scheduleDays.map((day) => (
          <div
            key={day.toString()}
            {...styles('full-calendar.all-day', 'ui-calendar-all-day', undefined, unstyled)}
          >
            {eventsForDay(day)
              .filter((s) => s.allDay)
              .map((span) => eventButton(span, day))}
          </div>
        ))}
        <div {...styles('full-calendar.hours', 'ui-calendar-hours', undefined, unstyled)}>
          {Array.from({ length: endHour - startHour }, (_, i) => (
            <span key={i}>{hourLabel(startHour + i, locale)}</span>
          ))}
        </div>
        {scheduleDays.map((day, dayIndex) => (
          <div
            key={day.toString()}
            {...styles('full-calendar.time-day', 'ui-calendar-time-day', undefined, unstyled)}
            onDragOver={(event) => {
              if (editable && !disabled) event.preventDefault();
            }}
            onDrop={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              drop(
                event,
                day,
                startHour * 60 +
                  Math.round((((event.clientY - rect.top) / rect.height) * totalMinutes) / slot) *
                    slot,
              );
            }}
          >
            <div
              {...styles('full-calendar.time-slots', 'ui-calendar-time-slots', undefined, unstyled)}
            >
              {(slotDescriptions.get(day.toString()) ?? []).map(({ minute, start, label }, i) => {
                return (
                  <button
                    key={i}
                    type="button"
                    data-calendar-slot={`${day.toString()}T${minute}`}
                    disabled={!selectable || disabled}
                    tabIndex={
                      selectable && day.toString() === focusDay && minute === focusMinute ? 0 : -1
                    }
                    aria-label={label}
                    onFocus={() => setSlotFocus({ day: day.toString(), minute })}
                    onKeyDown={(event) => keyboardSlot(event, dayIndex, i)}
                    onClick={(event) => selectSlot(start, event.shiftKey)}
                  />
                );
              })}
            </div>
            {eventColumns(
              eventsForDay(day).filter(
                (s) =>
                  !s.allDay &&
                  s.end.hour + (s.end.toPlainDate().equals(day) ? 0 : 24) > startHour &&
                  (s.start.toPlainDate().equals(day) ? s.start.hour : 0) < endHour,
              ),
            ).map(({ span, column, columns }) => {
              const start = span.start.toPlainDate().equals(day)
                ? span.start.hour * 60 + span.start.minute
                : 0;
              const end = span.end.toPlainDate().equals(day)
                ? span.end.hour * 60 + span.end.minute
                : 1440;
              const top = (Math.max(0, start - startHour * 60) / totalMinutes) * 100;
              const bottom = (Math.min(totalMinutes, end - startHour * 60) / totalMinutes) * 100;
              return eventButton(
                span,
                day,
                {
                  position: 'absolute',
                  top: `${top}%`,
                  height: `max(24px, ${bottom - top}%)`,
                  insetInlineStart: `calc(${(column / columns) * 100}% + 3px)`,
                  width: `calc(${100 / columns}% - 6px)`,
                },
                true,
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <StyleProvider unstyled={unstyled}>
      <div
        ref={(element) => {
          root.current = element;
          if (typeof containerRef === 'function') containerRef(element);
          else if (containerRef) containerRef.current = element;
        }}
        dir={direction}
        {...styles('full-calendar.root', 'ui-full-calendar', className, unstyled)}
        role="region"
        aria-label={t('calendar.label')}
        {...props}
        data-view={activeView}
        data-mobile={compact || undefined}
        data-disabled={disabled || undefined}
        style={style}
      >
        {toolbar === undefined ? (
          <div {...styles('full-calendar.toolbar', 'ui-calendar-toolbar', undefined, unstyled)}>
            <div
              {...styles('full-calendar.navigation', 'ui-calendar-navigation', undefined, unstyled)}
            >
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled}
                title={labels.previous ?? t('calendar.previous')}
                aria-label={labels.previous ?? t('calendar.previous')}
                onClick={api.prev}
              >
                {direction === 'rtl' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled}
                title={labels.next ?? t('calendar.next')}
                aria-label={labels.next ?? t('calendar.next')}
                onClick={api.next}
              >
                {direction === 'rtl' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </Button>
              <Button variant="outline" size="sm" disabled={disabled} onClick={api.today}>
                {labels.today ?? t('calendar.today')}
              </Button>
            </div>
            <h2
              {...styles('full-calendar.title', 'ui-calendar-title', undefined, unstyled)}
              aria-live="polite"
            >
              {title}
            </h2>
            <div {...styles('full-calendar.tools', 'ui-calendar-tools', undefined, unstyled)}>
              <Select
                value={activeView}
                disabled={disabled}
                onValueChange={(value) => changeView(value as FullCalendarView)}
              >
                <SelectTrigger aria-label={t('calendar.view')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {views.map((value) => (
                    <SelectItem key={value} value={value}>
                      {labels[value] ?? t(`calendar.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {printable && (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  title={labels.print ?? t('calendar.print')}
                  aria-label={labels.print ?? t('calendar.print')}
                  onClick={print}
                >
                  <Printer size={17} aria-hidden="true" />
                </Button>
              )}
              {toolbarActions}
            </div>
          </div>
        ) : typeof toolbar === 'function' ? (
          toolbar(api, context)
        ) : (
          toolbar
        )}
        {compact && (activeView === 'week' || activeView === 'agenda') && (
          <div
            {...styles('full-calendar.day-strip', 'ui-calendar-day-strip', undefined, unstyled)}
            role="group"
            aria-label={t('picker.chooseDate')}
          >
            {days.map((day) => (
              <Button
                key={day.toString()}
                variant={day.toString() === chosen ? 'primary' : 'ghost'}
                disabled={disabled}
                aria-pressed={day.toString() === chosen}
                onClick={() => setChosen(day.toString())}
              >
                <span>{dateLabel(day, locale, { weekday: 'narrow' })}</span>
                <span>{dateLabel(day, locale, { day: 'numeric' })}</span>
              </Button>
            ))}
          </div>
        )}
        {activeView === 'month'
          ? monthGrid()
          : activeView === 'agenda'
            ? agenda(compact ? [Temporal.PlainDate.from(chosen)] : days)
            : timeGrid()}
        {activeView === 'month' && (compact || expandedDay) && (
          <div
            {...styles(
              'full-calendar.selected-agenda',
              'ui-calendar-selected-agenda',
              undefined,
              unstyled,
            )}
          >
            {agenda([Temporal.PlainDate.from(expandedDay ?? chosen)])}
          </div>
        )}
        {selectable && compact && (
          <div
            {...styles('full-calendar.mobile-add', 'ui-calendar-mobile-add', undefined, unstyled)}
          >
            <Button
              variant="outline"
              disabled={disabled}
              onClick={() =>
                onSlotSelect?.({
                  ...dayRange(Temporal.PlainDate.from(chosen)),
                  allDay: true,
                  view: activeView,
                })
              }
            >
              <Plus size={16} />
              {labels.addEvent ?? t('calendar.addEvent')}
            </Button>
          </div>
        )}
        {printSnapshot &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              {...printProps}
              className={['ui-calendar-print', printProps?.className].filter(Boolean).join(' ')}
              dir={direction}
              aria-hidden="true"
              style={{
                ...tokensToStyle({ ...lightTokens, ...componentTokenAliases }),
                ...printProps?.style,
              }}
            >
              {renderPrint ? (
                renderPrint(printSnapshot)
              ) : (
                <>
                  {printHeader}
                  <h1>{printSnapshot.title}</h1>
                  <p>{printSnapshot.timeZone}</p>
                  {printMode === 'calendar' && activeView === 'month' ? (
                    monthGrid(true)
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('calendar.event')}</TableHead>
                          <TableHead>{t('calendar.start')}</TableHead>
                          <TableHead>{t('calendar.end')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {printSnapshot.events.map((event) => {
                          const span = eventSpan(event, timeZone);
                          const format = span?.allDay
                            ? { dateStyle: 'medium' as const }
                            : { dateStyle: 'medium' as const, timeStyle: 'short' as const };
                          return (
                            <TableRow key={event.id}>
                              <TableCell>{event.title}</TableCell>
                              <TableCell>
                                {span ? wallLabel(span.start, locale, format) : ''}
                              </TableCell>
                              <TableCell>
                                {span ? wallLabel(span.end, locale, format) : ''}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                  {printFooter}
                </>
              )}
            </div>,
            document.body,
          )}
      </div>
    </StyleProvider>
  );
}
export const FullCalendar = /* @__PURE__ */ React.forwardRef(CalendarComponent) as <
  T = Record<string, unknown>,
>(
  props: FullCalendarProps<T> & React.RefAttributes<FullCalendarRef>,
) => React.ReactElement;
export { CalendarEventDialog } from './calendar-event-dialog';
export type { CalendarEventDialogProps, CalendarEventDraft } from './calendar-event-dialog';
