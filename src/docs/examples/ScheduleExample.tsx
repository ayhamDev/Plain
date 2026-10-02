import * as React from 'react';
import { Temporal } from 'temporal-polyfill';
import { CalendarDays, Plus } from 'lucide-react';
import {
  FullCalendar,
  type FullCalendarEvent,
  type CalendarSelection,
  type FullCalendarRef,
} from '../../ui/full-calendar';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Field,
  Input,
  DatePicker,
  DateTimePicker,
  Checkbox,
  Label,
} from '../../ui';
import '../../ui/full-calendar.css';
const sample: FullCalendarEvent[] = [
  {
    id: 'launch',
    title: 'Launch week',
    start: '2026-10-05',
    end: '2026-10-08',
    allDay: true,
    color: 'var(--ui-chart-3)',
  },
  { id: 'kickoff', title: 'Project kickoff', start: '2026-10-05T09:00', end: '2026-10-05T10:00' },
  {
    id: 'standup',
    title: 'Team standup',
    start: '2026-10-05T09:30',
    end: '2026-10-05T10:15',
    color: 'var(--ui-chart-2)',
  },
  {
    id: 'research',
    title: 'Customer research',
    start: '2026-10-08T11:00',
    end: '2026-10-08T12:30',
    color: 'var(--ui-chart-4)',
  },
  { id: 'review', title: 'Design review', start: '2026-10-12T14:00', end: '2026-10-12T15:00' },
  {
    id: 'retro',
    title: 'Team retrospective',
    start: '2026-10-16T15:00',
    end: '2026-10-16T16:00',
    color: 'var(--ui-chart-2)',
  },
];
const dateValue = (value: unknown) => {
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day, 12) : undefined;
};
const dateString = (date: Date | undefined) =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : '';
export default function ScheduleExample() {
  const calendar = React.useRef<FullCalendarRef>(null);
  const [error, setError] = React.useState('');
  const [events, setEvents] = React.useState(sample);
  const [editing, setEditing] = React.useState<FullCalendarEvent>();
  const open = (selection: CalendarSelection) => {
    setError('');
    setEditing({
      id: crypto.randomUUID(),
      title: '',
      start: selection.start,
      end: selection.end,
      allDay: selection.allDay,
    });
  };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing?.title.trim()) return;
    try {
      if (
        !editing.end ||
        Temporal.PlainDateTime.compare(
          String(editing.start).includes('T')
            ? String(editing.start)
            : String(editing.start) + 'T00:00',
          String(editing.end).includes('T') ? String(editing.end) : String(editing.end) + 'T00:00',
        ) >= 0
      )
        throw new Error('Choose an end after the start.');
    } catch {
      setError('Choose valid dates with an end after the start.');
      return;
    }
    setError('');
    setEvents((current) => [...current.filter((event) => event.id !== editing.id), editing]);
    setEditing(undefined);
  };
  return (
    <div style={{ width: '100%' }}>
      <FullCalendar
        ref={calendar}
        defaultDate="2026-10-05"
        events={events}
        selectable
        editable
        onEventsChange={setEvents}
        onEventClick={(event) => {
          setError('');
          setEditing(event);
        }}
        onSlotSelect={open}
        toolbarActions={
          <Button
            size="icon"
            variant="ghost"
            aria-label="New event"
            title="New event"
            onClick={() => {
              const day = calendar.current?.getApi().getDate() ?? '2026-10-05';
              open({
                start: day + 'T09:00',
                end: day + 'T10:00',
                allDay: false,
                view: calendar.current?.getApi().getView() ?? 'month',
              });
            }}
          >
            <Plus size={17} />
          </Button>
        }
        printHeader={<p>P.UI project schedule</p>}
        printFooter={<p>Prepared for the team.</p>}
      />
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
      >
        <DialogContent>
          <DialogTitle>
            <CalendarDays size={18} />
            {events.some((event) => event.id === editing?.id) ? 'Edit event' : 'New event'}
          </DialogTitle>
          <DialogDescription>Project schedule</DialogDescription>
          {editing && (
            <form onSubmit={save} className="demo-form-stack">
              <Field label="Event title">
                <Input
                  autoFocus
                  required
                  value={editing.title}
                  onChange={(event) => setEditing({ ...editing, title: event.target.value })}
                />
              </Field>
              <Label className="demo-check-row">
                <Checkbox
                  checked={!!editing.allDay}
                  onCheckedChange={(allDay) =>
                    setEditing({
                      ...editing,
                      allDay: !!allDay,
                      start: allDay
                        ? String(editing.start).slice(0, 10)
                        : String(editing.start).slice(0, 10) + 'T09:00',
                      end: allDay
                        ? Temporal.PlainDate.from(String(editing.start).slice(0, 10))
                            .add({ days: 1 })
                            .toString()
                        : String(editing.end).slice(0, 10) + 'T10:00',
                    })
                  }
                />
                All day
              </Label>
              {editing.allDay ? (
                <>
                  <Field label="Start date">
                    <DatePicker
                      value={dateValue(editing.start)}
                      onValueChange={(date) => setEditing({ ...editing, start: dateString(date) })}
                    />
                  </Field>
                  <Field label="End date (exclusive)">
                    <DatePicker
                      value={dateValue(editing.end)}
                      calendarProps={{
                        disabled: { before: dateValue(editing.start) ?? new Date() },
                      }}
                      onValueChange={(date) => setEditing({ ...editing, end: dateString(date) })}
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Starts">
                    <DateTimePicker
                      required
                      value={String(editing.start)}
                      onValueChange={(start) => {
                        if (start) setEditing({ ...editing, start });
                      }}
                    />
                  </Field>
                  <Field label="Ends">
                    <DateTimePicker
                      required
                      min={String(editing.start)}
                      value={String(editing.end)}
                      onValueChange={(end) => {
                        if (end) setEditing({ ...editing, end });
                      }}
                    />
                  </Field>
                </>
              )}
              {error && (
                <p role="alert" className="text-destructive">
                  {error}
                </p>
              )}
              <DialogFooter>
                {events.some((event) => event.id === editing.id) && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEvents((current) => current.filter((event) => event.id !== editing.id));
                      setEditing(undefined);
                    }}
                  >
                    Delete event
                  </Button>
                )}
                <Button type="submit">Save event</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
