import * as React from 'react';
import { Plus } from 'lucide-react';
import {
  FullCalendar,
  CalendarEventDialog,
  type FullCalendarEvent,
  type CalendarSelection,
  type FullCalendarRef,
} from '@plain/ui/full-calendar';
import { Button } from '@plain/ui';
import '@plain/ui/full-calendar.css';
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
export default function ScheduleExample() {
  const calendar = React.useRef<FullCalendarRef>(null);
  const [events, setEvents] = React.useState(sample);
  const [editing, setEditing] = React.useState<FullCalendarEvent>();
  const open = (selection: CalendarSelection) => {
    setEditing({
      id: crypto.randomUUID(),
      title: '',
      start: selection.start,
      end: selection.end,
      allDay: selection.allDay,
    });
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
      <CalendarEventDialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
        event={events.find((event) => event.id === editing?.id)}
        selection={
          editing
            ? {
                start: String(editing.start),
                end: String(editing.end),
                allDay: !!editing.allDay,
                view: calendar.current?.getApi().getView() ?? 'month',
              }
            : undefined
        }
        description="Project schedule"
        onSave={(draft) => {
          if (editing)
            setEvents((values) => [
              ...values.filter((value) => value.id !== editing.id),
              { ...editing, ...draft },
            ]);
        }}
        renderFooter={(save, pending) => (
          <>
            {events.some((event) => event.id === editing?.id) && (
              <Button
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  setEvents((values) => values.filter((value) => value.id !== editing?.id));
                  setEditing(undefined);
                }}
              >
                Delete event
              </Button>
            )}
            <Button disabled={pending} onClick={save}>
              Save event
            </Button>
          </>
        )}
      />
    </div>
  );
}
