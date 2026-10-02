import * as React from 'react';
import { FullCalendar, type FullCalendarEvent } from '../../ui/full-calendar';
import '../../ui/full-calendar.css';
export default function ScheduleExample() {
  const [events, setEvents] = React.useState<FullCalendarEvent[]>([
    { id: 'kickoff', title: 'Project kickoff', start: '2026-10-05T09:00', end: '2026-10-05T10:00' },
    { id: 'review', title: 'Design review', start: '2026-10-12T14:00' },
  ]);
  return (
    <FullCalendar
      defaultView="dayGridMonth"
      initialDate="2026-10-01"
      height={480}
      events={events}
      selectable
      select={(selection) => {
        setEvents((current) => [
          ...current,
          {
            id: String(Date.now()),
            title: 'New meeting',
            start: selection.startStr,
            end: selection.endStr,
          },
        ]);
      }}
      style={{ width: '100%' }}
    />
  );
}
