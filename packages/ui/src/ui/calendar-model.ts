import { Temporal } from 'temporal-polyfill';

export type CalendarDate = string | Date;
export type FullCalendarView = 'month' | 'week' | 'day' | 'agenda';
export interface FullCalendarEvent<T = Record<string, unknown>> {
  id: string;
  title: string;
  start: CalendarDate;
  /** Exclusive end, including all-day events. Omission means one hour or one day. */
  end?: CalendarDate;
  allDay?: boolean;
  color?: string;
  data?: T;
  editable?: boolean;
}
export interface CalendarRange {
  start: string;
  end: string;
}
export interface CalendarEventSpan<T = Record<string, unknown>> {
  event: FullCalendarEvent<T>;
  start: Temporal.PlainDateTime;
  end: Temporal.PlainDateTime;
  allDay: boolean;
}
export function calendarDay(value: CalendarDate, timeZone = 'local') {
  const zone = calendarZone(timeZone);
  if (value instanceof Date)
    return Temporal.Instant.fromEpochMilliseconds(value.getTime())
      .toZonedDateTimeISO(zone)
      .toPlainDate();
  if (/T.*(?:Z|[+-]\d\d:\d\d)(?:\[.*\])?$/.test(value))
    return Temporal.Instant.from(value).toZonedDateTimeISO(zone).toPlainDate();
  return Temporal.PlainDate.from(value.slice(0, 10));
}
export function calendarZone(timeZone: string) {
  return timeZone === 'local' ? Temporal.Now.timeZoneId() : timeZone;
}
export function calendarWall(value: CalendarDate, timeZone: string) {
  if (value instanceof Date)
    return Temporal.Instant.fromEpochMilliseconds(value.getTime())
      .toZonedDateTimeISO(calendarZone(timeZone))
      .toPlainDateTime();
  if (/T.*(?:Z|[+-]\d\d:\d\d)(?:\[.*\])?$/.test(value))
    return Temporal.Instant.from(value)
      .toZonedDateTimeISO(calendarZone(timeZone))
      .toPlainDateTime();
  return value.includes('T')
    ? Temporal.PlainDateTime.from(value)
    : Temporal.PlainDate.from(value).toPlainDateTime();
}
export function eventSpan<T>(
  event: FullCalendarEvent<T>,
  timeZone = 'local',
): CalendarEventSpan<T> | undefined {
  try {
    const allDay = event.allDay ?? (typeof event.start === 'string' && !event.start.includes('T'));
    const start = calendarWall(event.start, timeZone);
    const end = event.end
      ? calendarWall(event.end, timeZone)
      : start.add(allDay ? { days: 1 } : { hours: 1 });
    if (Temporal.PlainDateTime.compare(start, end) >= 0) return undefined;
    return { event, start, end, allDay };
  } catch {
    return undefined;
  }
}
export function startOfWeek(date: Temporal.PlainDate, weekStartsOn = 0) {
  return date.subtract({ days: ((date.dayOfWeek % 7) - weekStartsOn + 7) % 7 });
}
export function calendarRange(
  date: Temporal.PlainDate,
  view: FullCalendarView,
  weekStartsOn = 0,
): CalendarRange {
  const first =
    view === 'month'
      ? date.with({ day: 1 })
      : view === 'day'
        ? date
        : startOfWeek(date, weekStartsOn);
  const end =
    view === 'month' ? first.add({ months: 1 }) : first.add({ days: view === 'day' ? 1 : 7 });
  return { start: first.toString(), end: end.toString() };
}
export function eventsInRange<T>(spans: CalendarEventSpan<T>[], range: CalendarRange) {
  const start = Temporal.PlainDate.from(range.start).toPlainDateTime(),
    end = Temporal.PlainDate.from(range.end).toPlainDateTime();
  return spans
    .filter(
      (s) =>
        Temporal.PlainDateTime.compare(s.start, end) < 0 &&
        Temporal.PlainDateTime.compare(s.end, start) > 0,
    )
    .sort(
      (a, b) =>
        Number(b.allDay) - Number(a.allDay) ||
        Temporal.PlainDateTime.compare(a.start, b.start) ||
        a.event.id.localeCompare(b.event.id),
    );
}
export function dayEvents<T>(spans: CalendarEventSpan<T>[], date: Temporal.PlainDate) {
  return eventsInRange(spans, { start: date.toString(), end: date.add({ days: 1 }).toString() });
}
/** Partition concurrent timed events into non-overlapping columns, per connected group. */
export function eventColumns<T>(spans: CalendarEventSpan<T>[]) {
  const sorted = [...spans].sort((a, b) => Temporal.PlainDateTime.compare(a.start, b.start));
  const result: { span: CalendarEventSpan<T>; column: number; columns: number }[] = [];
  let group: typeof result = [],
    ends: Temporal.PlainDateTime[] = [];
  const flush = () => {
    group.forEach((item) => {
      item.columns = ends.length;
      result.push(item);
    });
    group = [];
    ends = [];
  };
  for (const span of sorted) {
    if (ends.length && ends.every((end) => Temporal.PlainDateTime.compare(end, span.start) <= 0))
      flush();
    let column = ends.findIndex((end) => Temporal.PlainDateTime.compare(end, span.start) <= 0);
    if (column < 0) column = ends.length;
    ends[column] = span.end;
    group.push({ span, column, columns: 1 });
  }
  flush();
  return result;
}
function eventDate<T>(
  span: CalendarEventSpan<T>,
  date: Temporal.PlainDateTime,
  timeZone: string,
  original?: CalendarDate,
): CalendarDate {
  if (span.allDay) return date.toPlainDate().toString();
  if (original instanceof Date)
    return new Date(date.toZonedDateTime(calendarZone(timeZone)).epochMilliseconds);
  if (typeof original === 'string' && /T.*(?:Z|[+-]\d\d:\d\d)(?:\[.*\])?$/.test(original))
    return date.toZonedDateTime(calendarZone(timeZone)).toInstant().toString();
  return date.toString();
}
export function moveCalendarEvent<T>(
  span: CalendarEventSpan<T>,
  duration: { days?: number; minutes?: number },
  timeZone: string,
): FullCalendarEvent<T> {
  return {
    ...span.event,
    start: eventDate(span, span.start.add(duration), timeZone, span.event.start),
    end: eventDate(span, span.end.add(duration), timeZone, span.event.end ?? span.event.start),
  };
}
export function resizeCalendarEvent<T>(
  span: CalendarEventSpan<T>,
  duration: { days?: number; minutes?: number },
  timeZone: string,
): FullCalendarEvent<T> {
  return {
    ...span.event,
    end: eventDate(span, span.end.add(duration), timeZone, span.event.end ?? span.event.start),
  };
}
