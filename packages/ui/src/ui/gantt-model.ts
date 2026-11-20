import { Temporal } from 'temporal-polyfill';

export type GanttScale = 'day' | 'week' | 'month';
export type GanttEditMode = 'move' | 'start' | 'end';
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
export type GanttRange = NonNullable<ReturnType<typeof ganttRange>>;
export function ganttNumber(
  value: number | undefined,
  fallback: number,
  min: number,
  max = Infinity,
) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value!)) : fallback;
}
export const ganttProgress = (value?: number) => ganttNumber(value, 0, 0, 100);
export function ganttDate(date: Temporal.PlainDate) {
  const result = new Date(0);
  result.setUTCFullYear(date.year, date.month - 1, date.day);
  return result;
}
export function ganttTicks(range: GanttRange, scale: GanttScale, weekStartsOn: number) {
  const result: { index: number; end: number; date: Temporal.PlainDate }[] = [];
  let date = range.from;
  while (Temporal.PlainDate.compare(date, range.to) < 0) {
    const next =
      scale === 'month'
        ? date.with({ day: 1 }).add({ months: 1 })
        : date.add({ days: scale === 'week' ? ((weekStartsOn - date.dayOfWeek + 6) % 7) + 1 : 1 });
    result.push({
      date,
      index: range.from.until(date).days,
      end: Math.min(range.days, range.from.until(next).days),
    });
    date = next;
  }
  return result;
}
export function ganttPeriods(range: GanttRange, scale: GanttScale) {
  const result: { index: number; end: number; date: Temporal.PlainDate }[] = [];
  let date = range.from;
  while (Temporal.PlainDate.compare(date, range.to) < 0) {
    const next =
      scale === 'month'
        ? date.with({ month: 1, day: 1 }).add({ years: 1 })
        : date.with({ day: 1 }).add({ months: 1 });
    result.push({
      date,
      index: range.from.until(date).days,
      end: Math.min(range.days, range.from.until(next).days),
    });
    date = next;
  }
  return result;
}
export function ganttLayout(row: GanttRange, range: GanttRange, px: number) {
  const start = Math.max(0, range.from.until(row.from).days);
  const end = Math.min(range.days, range.from.until(row.to).days);
  return { left: start * px, width: Math.max(0, (end - start) * px) };
}
export function ganttEdit(
  task: { start: string; end: string },
  mode: GanttEditMode,
  delta: number,
) {
  const range = ganttRange(task.start, task.end);
  if (!range || !Number.isFinite(delta)) return undefined;
  const days = Math.round(delta);
  try {
    const from =
      mode === 'end'
        ? range.from
        : range.from.add({ days: mode === 'start' ? Math.min(days, range.days - 1) : days });
    const to =
      mode === 'start'
        ? range.to
        : range.to.add({ days: mode === 'end' ? Math.max(days, 1 - range.days) : days });
    return { start: from.toString(), end: to.toString() };
  } catch {
    return undefined;
  }
}
// Round orthogonal corners without introducing an SVG/routing dependency.
function roundedPath(points: [number, number][], radius: number) {
  let path = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i],
      [px, py] = points[i - 1],
      [nx, ny] = points[i + 1];
    const before = Math.hypot(x - px, y - py),
      after = Math.hypot(nx - x, ny - y);
    if (!before || !after) continue;
    const r = Math.min(radius, before / 2, after / 2);
    path += ` L ${x - ((x - px) / before) * r} ${y - ((y - py) / before) * r}`;
    path += ` Q ${x} ${y} ${x + ((nx - x) / after) * r} ${y + ((ny - y) / after) * r}`;
  }
  return `${path} L ${points.at(-1)![0]} ${points.at(-1)![1]}`;
}
export function ganttDependency(x1: number, y1: number, x2: number, y2: number, rowHeight: number) {
  if (x2 - x1 >= 24) {
    const middle = (x1 + x2) / 2;
    return roundedPath(
      [
        [x1, y1],
        [middle, y1],
        [middle, y2],
        [x2, y2],
      ],
      4,
    );
  }
  const gutter = y1 + (y2 > y1 ? rowHeight / 2 : -rowHeight / 2);
  return roundedPath(
    [
      [x1, y1],
      [x1 + 12, y1],
      [x1 + 12, gutter],
      [x2 - 12, gutter],
      [x2 - 12, y2],
      [x2, y2],
    ],
    4,
  );
}
