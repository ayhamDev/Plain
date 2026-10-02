import * as React from 'react';
import { Temporal } from 'temporal-polyfill';
import { CalendarDays } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './overlays';
import { Button } from './primitives';
import { Input, Field, Checkbox, Label } from './forms';
import { DateTimePicker } from './date-time';
import { DatePicker } from './calendar';
import { useTranslation } from './i18n';
import { calendarWall, calendarZone, type FullCalendarEvent } from './calendar-model';
import type { CalendarSelection } from './full-calendar';

export interface CalendarEventDraft {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
}
export interface CalendarEventDialogProps<T = Record<string, unknown>> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Initial event for an open session. Close/reopen or key the dialog to switch drafts. */
  event?: FullCalendarEvent<T>;
  selection?: CalendarSelection;
  onSave: (draft: CalendarEventDraft, event?: FullCalendarEvent<T>) => void | Promise<void>;
  title?: React.ReactNode;
  description?: React.ReactNode;
  renderFields?: (
    draft: CalendarEventDraft,
    update: (patch: Partial<CalendarEventDraft>) => void,
  ) => React.ReactNode;
  renderFooter?: (save: () => void, pending: boolean) => React.ReactNode;
  disabled?: boolean;
  timeZone?: string;
  contentProps?: React.ComponentProps<typeof DialogContent>;
}
function localDate(value: string) {
  try {
    const day = Temporal.PlainDate.from(value.slice(0, 10));
    const date = new Date(0);
    date.setFullYear(day.year, day.month - 1, day.day);
    date.setHours(12, 0, 0, 0);
    return date;
  } catch {
    return undefined;
  }
}
function isoDate(date?: Date) {
  return date
    ? Temporal.PlainDate.from({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      }).toString()
    : '';
}
function EventForm<T>(props: CalendarEventDialogProps<T>) {
  const language = useTranslation();
  const { t } = language;
  const timeZone = props.timeZone ?? language.timeZone ?? 'local';
  const form = React.useRef<HTMLFormElement>(null);
  const [draft, setDraft] = React.useState<CalendarEventDraft>(() => {
    const input = props.event ?? props.selection;
    const allDay =
      input?.allDay ?? (typeof input?.start === 'string' && !input.start.includes('T'));
    try {
      const start = input?.start
        ? calendarWall(input.start, timeZone)
        : Temporal.Now.plainDateISO(calendarZone(timeZone)).toPlainDateTime({ hour: 9 });
      const end = input?.end
        ? calendarWall(input.end, timeZone)
        : start.add(allDay ? { days: 1 } : { hours: 1 });
      return {
        title: props.event?.title ?? '',
        start: allDay ? start.toPlainDate().toString() : start.toString({ smallestUnit: 'minute' }),
        end: allDay ? end.toPlainDate().toString() : end.toString({ smallestUnit: 'minute' }),
        allDay: !!allDay,
      };
    } catch {
      return { title: props.event?.title ?? '', start: '', end: '', allDay: !!allDay };
    }
  });
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState('');
  const alive = React.useRef(true);
  const busy = React.useRef(false);
  React.useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const update = (patch: Partial<CalendarEventDraft>) =>
    setDraft((value) => ({ ...value, ...patch }));
  const timed = React.useRef({ start: draft.start, end: draft.end });
  const toggleAllDay = (allDay: boolean) => {
    if (allDay) {
      timed.current = { start: draft.start, end: draft.end };
      const start = draft.start.slice(0, 10);
      let end = draft.end.slice(0, 10);
      try {
        if (draft.end.slice(11) !== '00:00' && draft.end.slice(11) !== '00:00:00')
          end = Temporal.PlainDate.from(end).add({ days: 1 }).toString();
        if (Temporal.PlainDate.compare(start, end) >= 0)
          end = Temporal.PlainDate.from(start).add({ days: 1 }).toString();
      } catch {
        /* Invalid drafts remain editable. */
      }
      update({ allDay, start, end });
    } else {
      const start = `${draft.start.slice(0, 10)}T${timed.current.start.slice(11) || '09:00'}`;
      let end = `${draft.end.slice(0, 10)}T${timed.current.end.slice(11) || '10:00'}`;
      try {
        // Switching back restores the timed interval when the selected days did not change.
        if (
          timed.current.start.includes('T') &&
          timed.current.start.slice(0, 10) === draft.start &&
          Temporal.PlainDate.from(timed.current.end.slice(0, 10)).add({ days: 1 }).toString() ===
            draft.end
        )
          end = timed.current.end;
        if (Temporal.PlainDateTime.compare(start, end) >= 0)
          end = Temporal.PlainDateTime.from(start)
            .add({ hours: 1 })
            .toString({ smallestUnit: 'minute' });
      } catch {
        /* Required pickers handle incomplete drafts. */
      }
      update({ allDay, start, end });
    }
  };
  const save = async () => {
    if (busy.current || props.disabled) return;
    let validated = false;
    try {
      if (!draft.title.trim()) {
        setError(t('calendar.requiredTitle'));
        return;
      }
      const compare = draft.allDay
        ? Temporal.PlainDate.compare(draft.start.slice(0, 10), draft.end.slice(0, 10))
        : Temporal.PlainDateTime.compare(draft.start, draft.end);
      if (compare >= 0) throw new Error(t('calendar.invalidEvent'));
      validated = true;
      busy.current = true;
      setPending(true);
      setError('');
      await props.onSave(
        {
          ...draft,
          title: draft.title.trim(),
          start: draft.allDay ? draft.start.slice(0, 10) : draft.start,
          end: draft.allDay ? draft.end.slice(0, 10) : draft.end,
        },
        props.event,
      );
      if (alive.current) props.onOpenChange(false);
    } catch (failure) {
      if (alive.current)
        setError(
          validated && failure instanceof Error ? failure.message : t('calendar.invalidEvent'),
        );
    } finally {
      busy.current = false;
      if (alive.current) setPending(false);
    }
  };
  return (
    <form
      ref={form}
      aria-busy={pending || undefined}
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <DialogHeader>
        <CalendarDays size={20} aria-hidden="true" />
        <DialogTitle>
          {props.title ?? t(props.event ? 'calendar.editEvent' : 'calendar.addEvent')}
        </DialogTitle>
        {props.description && <DialogDescription>{props.description}</DialogDescription>}
      </DialogHeader>
      <div className="ui-event-form-fields">
        <Field label={t('calendar.title')}>
          <Input
            value={draft.title}
            onChange={(event) => update({ title: event.target.value })}
            required
            disabled={pending || props.disabled}
          />
        </Field>
        <Label>
          <Checkbox
            checked={draft.allDay}
            onCheckedChange={(checked) => toggleAllDay(checked === true)}
            disabled={pending || props.disabled}
          />
          {t('calendar.allDay')}
        </Label>
        <Field label={t('calendar.start')}>
          {draft.allDay ? (
            <DatePicker
              value={localDate(draft.start)}
              onValueChange={(value) => update({ start: isoDate(value) })}
              aria-required
              disabled={pending || props.disabled}
            />
          ) : (
            <DateTimePicker
              value={draft.start.length === 10 ? `${draft.start}T09:00` : draft.start}
              onValueChange={(value) => update({ start: value ?? '' })}
              required
              disabled={pending || props.disabled}
            />
          )}
        </Field>
        <Field label={t('calendar.end')}>
          {draft.allDay ? (
            <DatePicker
              value={localDate(draft.end)}
              onValueChange={(value) => update({ end: isoDate(value) })}
              aria-required
              disabled={pending || props.disabled}
            />
          ) : (
            <DateTimePicker
              value={draft.end.length === 10 ? `${draft.end}T09:00` : draft.end}
              onValueChange={(value) => update({ end: value ?? '' })}
              required
              disabled={pending || props.disabled}
            />
          )}
        </Field>
        {props.renderFields?.(draft, update)}
        {error && (
          <p role="alert" className="ui-event-form-error">
            {error}
          </p>
        )}
      </div>
      <DialogFooter>
        {props.renderFooter ? (
          props.renderFooter(() => form.current?.requestSubmit(), pending)
        ) : (
          <>
            <Button variant="ghost" disabled={pending} onClick={() => props.onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={pending || props.disabled}>
              {t(pending ? 'common.loading' : 'calendar.saveEvent')}
            </Button>
          </>
        )}
      </DialogFooter>
    </form>
  );
}
/** Optional editor. FullCalendar never owns application persistence or embeds a form. */
export function CalendarEventDialog<T>(props: CalendarEventDialogProps<T>) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent
        {...(!props.description ? { 'aria-describedby': undefined } : {})}
        {...props.contentProps}
      >
        {props.open && <EventForm {...props} />}
      </DialogContent>
    </Dialog>
  );
}
