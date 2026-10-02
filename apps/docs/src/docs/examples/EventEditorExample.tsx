import * as React from 'react';
import { CalendarEventDialog, type CalendarEventDraft } from '@plain/ui/full-calendar';
import { Button, Small, Stack } from '@plain/ui';
export default function EventEditorExample() {
  const [open, setOpen] = React.useState(false);
  const [saved, setSaved] = React.useState<CalendarEventDraft>();
  return (
    <Stack gap={2}>
      <Button onClick={() => setOpen(true)}>New event</Button>
      <Small role="status" tone="muted">
        {saved?.title}
      </Small>
      <CalendarEventDialog
        open={open}
        onOpenChange={setOpen}
        selection={{
          start: '2026-10-05T09:00',
          end: '2026-10-05T10:00',
          allDay: false,
          view: 'week',
        }}
        onSave={setSaved}
      />
    </Stack>
  );
}
