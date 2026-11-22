import type { Temporal } from 'temporal-polyfill';
import { Popover, PopoverTrigger, PopoverContent } from './popover';
import { useDirection, useStyles } from './style-context';
import { numberFormatter, useTranslation } from './i18n';
import type { useGanttDrag } from './gantt-drag';
import type { GanttTask, GanttChartProps } from './gantt';
import { ganttRange, ganttProgress, ganttEdit } from './gantt-model';

export function GanttBar<T>({
  task,
  position,
  dateText,
  instructions,
  drag,
  onEdit,
  onTaskClick,
  renderTask,
  renderTaskDetails,
  showTaskDetails,
  draggable,
  resizable,
  labelPosition,
  dependencies,
}: {
  task: GanttTask<T>;
  position: { left: number; width: number };
  dateText: (date: Temporal.PlainDate) => string;
  instructions: string;
  drag: ReturnType<typeof useGanttDrag<T>>;
  onEdit?: GanttChartProps<T>['onTaskChange'];
  onTaskClick?: GanttChartProps<T>['onTaskClick'];
  renderTask?: GanttChartProps<T>['renderTask'];
  renderTaskDetails?: GanttChartProps<T>['renderTaskDetails'];
  showTaskDetails: boolean;
  draggable: boolean;
  resizable: boolean;
  labelPosition: NonNullable<GanttChartProps<T>['labelPosition']>;
  dependencies: readonly string[];
}) {
  const styles = useStyles(),
    { t, locale } = useTranslation(),
    direction = useDirection();
  const range = ganttRange(task.start, task.end)!;
  const progress = ganttProgress(task.progress);
  const percent = numberFormatter(locale, { style: 'percent', maximumFractionDigits: 1 }).format(
    progress / 100,
  );
  const outside = labelPosition === 'outside' || (labelPosition === 'auto' && position.width < 112);
  const interactive = !!(onTaskClick || onEdit || showTaskDetails);
  const TaskElement = interactive ? 'button' : 'div';
  const edit = (mode: 'move' | 'start' | 'end', delta: number) => {
    if (!onEdit || task.disabled) return;
    const dates = ganttEdit(task, mode, delta);
    if (dates && (dates.start !== task.start || dates.end !== task.end))
      onEdit({ ...task, ...dates }, task, mode === 'move' ? 'move' : 'resize');
  };
  const surface = (
    <TaskElement
      {...(interactive
        ? { type: 'button' as const, disabled: task.disabled }
        : { role: 'img', tabIndex: task.disabled ? -1 : 0 })}
      {...styles('gantt.task', 'ui-gantt-task')}
      {...(onEdit && draggable ? drag.handlers(task, 'move') : {})}
      data-draggable={(!!onEdit && draggable) || undefined}
      aria-label={`${task.label}, ${dateText(range.from)} - ${dateText(range.to)}, ${percent}${dependencies.length ? `, ${t('gantt.dependencies')}: ${dependencies.join(', ')}` : ''}`}
      aria-describedby={onEdit ? instructions : undefined}
      onClick={(event) => {
        if (!drag.preventClick(event)) onTaskClick?.(task);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          drag.cancel();
          return;
        }
        if (!event.altKey || !onEdit || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        edit(
          event.shiftKey ? 'end' : 'move',
          (event.key === 'ArrowRight') === (direction !== 'rtl') ? 1 : -1,
        );
      }}
    >
      <span {...styles('gantt.surface', 'ui-gantt-surface')}>
        <span
          {...styles('gantt.progress', 'ui-gantt-progress')}
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
        {!outside && labelPosition !== 'hidden' && (
          <span {...styles('gantt.task-label', 'ui-gantt-task-label')}>
            {renderTask?.(task) ?? task.label}
          </span>
        )}
      </span>
    </TaskElement>
  );
  return (
    <div
      {...styles('gantt.bar', 'ui-gantt-bar')}
      data-colored={!!task.color || undefined}
      data-disabled={task.disabled || undefined}
      style={
        {
          insetInlineStart: position.left,
          width: position.width,
          '--ui-gantt-task-width': `${position.width}px`,
          '--ui-gantt-task-color': task.color ?? 'var(--ui-accent)',
        } as React.CSSProperties
      }
    >
      {showTaskDetails ? (
        <Popover>
          <PopoverTrigger asChild>{surface}</PopoverTrigger>
          <PopoverContent
            align="start"
            aria-label={task.label}
            {...styles('gantt.details', 'ui-gantt-details')}
          >
            {renderTaskDetails ? (
              renderTaskDetails(task)
            ) : (
              <>
                <strong {...styles('gantt.details-title', 'ui-gantt-details-title')}>
                  {task.label}
                </strong>
                <dl>
                  <div>
                    <dt>{t('calendar.start')}</dt>
                    <dd>{dateText(range.from)}</dd>
                  </div>
                  <div>
                    <dt>{t('gantt.endExclusive')}</dt>
                    <dd>{dateText(range.to)}</dd>
                  </div>
                  <div>
                    <dt>{t('gantt.duration')}</dt>
                    <dd>
                      {numberFormatter(locale, {
                        style: 'unit',
                        unit: 'day',
                        unitDisplay: 'long',
                      }).format(range.days)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('chart.progress')}</dt>
                    <dd>{percent}</dd>
                  </div>
                </dl>
                {dependencies.length > 0 && (
                  <p>
                    {t('gantt.dependencies')}: {dependencies.join(', ')}
                  </p>
                )}
              </>
            )}
          </PopoverContent>
        </Popover>
      ) : (
        surface
      )}
      {outside && (
        <span {...styles('gantt.outside-label', 'ui-gantt-outside-label')} aria-hidden="true">
          {renderTask?.(task) ?? task.label}
        </span>
      )}
      {!!onEdit &&
        resizable &&
        position.width >= 72 &&
        !task.disabled &&
        (['start', 'end'] as const).map((edge) => (
          <button
            key={edge}
            type="button"
            {...styles('gantt.resize-handle', 'ui-gantt-resize')}
            data-edge={edge}
            aria-label={t(edge === 'start' ? 'gantt.editStart' : 'gantt.editEnd', {
              label: task.label,
            })}
            aria-describedby={instructions}
            {...drag.handlers(task, edge)}
            onClick={(event) => {
              drag.preventClick(event);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                drag.cancel();
                return;
              }
              if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
              event.preventDefault();
              edit(edge, (event.key === 'ArrowRight') === (direction !== 'rtl') ? 1 : -1);
            }}
          />
        ))}
    </div>
  );
}
