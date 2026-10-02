import { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { Calendar } from '@plain/ui/calendar';

export default function CalendarDemo() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 9, 14));
  return (
    <div className="calendar-demo">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        defaultMonth={new Date(2026, 9)}
        aria-label="Project due date"
      />
      <div className="calendar-demo-footer">
        <span>
          {date
            ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
            : 'No date selected'}
        </span>
        <span>
          <LockKeyhole size={12} aria-hidden="true" />
          Your time, well spent.
        </span>
      </div>
    </div>
  );
}
