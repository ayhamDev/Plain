import * as React from 'react';
import type { Temporal } from 'temporal-polyfill';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './table';
import { dateFormatter, numberFormatter, useTranslation } from './i18n';
import { ganttDate, ganttProgress } from './gantt-model';
import type { GanttTask } from './gantt';

function GanttDataTableImpl<T>({
  rows,
  label,
  presentation,
}: {
  rows: readonly { task: GanttTask<T>; from: Temporal.PlainDate; to: Temporal.PlainDate }[];
  label?: string;
  presentation: 'visible' | 'sr-only';
}) {
  const { t, locale } = useTranslation();
  const format = dateFormatter(locale, {
    calendar: 'gregory',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const percent = numberFormatter(locale, { style: 'percent', maximumFractionDigits: 1 });
  const names = new Map(rows.map((row) => [row.task.id, row.task.label]));
  const dependencies = rows.some((row) => row.task.dependencies?.length);
  return (
    <div className={presentation === 'sr-only' ? 'ui-visually-hidden' : undefined}>
      <Table aria-label={t('chart.data', { label: label ?? t('chart.gantt') })}>
        <TableHeader>
          <TableRow>
            <TableHead>{t('chart.task')}</TableHead>
            <TableHead>{t('calendar.start')}</TableHead>
            <TableHead>{t('gantt.endExclusive')}</TableHead>
            <TableHead>{t('chart.progress')}</TableHead>
            {dependencies && <TableHead>{t('gantt.dependencies')}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.task.id}>
              <TableCell>{row.task.label}</TableCell>
              <TableCell>{format.format(ganttDate(row.from))}</TableCell>
              <TableCell>{format.format(ganttDate(row.to))}</TableCell>
              <TableCell>{percent.format(ganttProgress(row.task.progress) / 100)}</TableCell>
              {dependencies && (
                <TableCell>
                  {(row.task.dependencies ?? []).map((id) => names.get(id) ?? id).join(', ') || '—'}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
// Scrolling/drag previews must not rebuild the complete nonvisual alternative.
export const GanttDataTable = /* @__PURE__ */ React.memo(
  GanttDataTableImpl,
) as typeof GanttDataTableImpl;
