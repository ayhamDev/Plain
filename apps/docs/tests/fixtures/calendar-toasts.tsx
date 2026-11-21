import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button,
  Calendar,
  DatePicker,
  DateRangePicker,
  DateTimePicker,
  DateTimeRangePicker,
  LanguageProvider,
  PlainProvider,
  Toaster,
  toast,
  useTheme,
} from '@plain/ui';
import '@plain/ui/styles.css';

const params = new URLSearchParams(location.search);
if (params.has('inter')) await import('../../src/docs/font.css');
const view = params.get('view') ?? 'calendar';
const dir = params.get('dir') === 'rtl' ? 'rtl' : 'ltr';
const locale = params.get('locale') ?? (dir === 'rtl' ? 'ar' : 'en');
const today = new Date(2026, 9, 5);
const start = new Date(1980, 0);
const end = new Date(2035, 11);
const unavailable = new Date(1985, 1, 15);
const config = {
  today,
  defaultMonth: today,
  reverseYears: params.has('descending'),
  styles: params.has('largeLabels')
    ? {
        months_dropdown: { fontSize: '18px' },
        years_dropdown: { fontSize: '18px' },
      }
    : undefined,
};
function Workspace() {
  const { resolvedMode, setTheme } = useTheme();
  const [date, setDate] = React.useState<Date>();
  const [result, setResult] = React.useState('Not submitted');
  const [action, setAction] = React.useState('');
  return (
    <>
      <main style={{ padding: 16, display: 'grid', gap: 16, maxWidth: 640 }}>
        <h1>Calendar navigation and toast contrast</h1>
        <form
          aria-label="Schedule"
          style={{ display: 'grid', gap: 16 }}
          onSubmit={(event) => {
            event.preventDefault();
            setResult(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
          }}
        >
          {view === 'calendar' && (
            <>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                startMonth={start}
                endMonth={end}
                disabled={unavailable}
                {...config}
              />
              <input
                type="hidden"
                name="value"
                value={
                  date
                    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                    : ''
                }
              />
            </>
          )}
          {view === 'date-picker' && (
            <DatePicker
              aria-label="Appointment date"
              name="value"
              calendarProps={{ ...config, startMonth: start, endMonth: end, disabled: unavailable }}
            />
          )}
          {view === 'date-range-picker' && (
            <DateRangePicker
              aria-label="Travel dates"
              name="travel"
              min={start}
              max="2035-12-31"
              disabledDates={unavailable}
              calendarProps={config}
              defaultValue={
                params.has('existing')
                  ? { from: new Date(2026, 9, 4), to: new Date(2026, 9, 29) }
                  : undefined
              }
            />
          )}
          {view === 'date-time-picker' && (
            <DateTimePicker
              aria-label="Appointment"
              name="value"
              defaultValue="2026-10-05T09:15"
              min="1980-01-01T00:00"
              max="2035-12-31T23:59"
              disabledDates={unavailable}
              calendarProps={config}
            />
          )}
          {view === 'date-time-range-picker' && (
            <DateTimeRangePicker
              fromLabel="Start"
              toLabel="End"
              fromName="from"
              toName="to"
              defaultValue={{ from: '2026-10-05T09:15', to: '2026-10-05T12:30' }}
              min="1980-01-01T00:00"
              max="2035-12-31T23:59"
              disabledDates={unavailable}
              calendarProps={config}
            />
          )}
          <Button type="submit">Submit schedule</Button>
          <output aria-label="Submitted values">{result}</output>
        </form>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            onClick={() =>
              toast.success('Changes saved', {
                duration: Infinity,
                description: 'Everything is up to date.',
              })
            }
          >
            Success toast
          </Button>
          <Button
            onClick={() =>
              toast.error('Something went wrong', {
                duration: Infinity,
                description: 'Please try again.',
              })
            }
          >
            Error toast
          </Button>
          <Button
            onClick={() =>
              toast('Project archived', {
                duration: Infinity,
                action: { label: 'Undo', onClick: () => setAction('Project restored') },
              })
            }
          >
            Toast with action
          </Button>
          <Button onClick={() => toast('Inverse override', { duration: Infinity, invert: true })}>
            Inverse override
          </Button>
          <Button onClick={() => setTheme({ mode: resolvedMode === 'light' ? 'dark' : 'light' })}>
            Toggle theme
          </Button>
        </div>
        <output aria-label="Toast action">{action}</output>
      </main>
      <Toaster invert={params.has('surface') ? false : undefined} expand />
    </>
  );
}
createRoot(document.getElementById('root')!).render(
  <PlainProvider
    persist={false}
    dir={dir}
    theme={{ mode: params.get('theme') === 'dark' ? 'dark' : 'light', motion: 'none' }}
  >
    <LanguageProvider locale={locale} dir={dir}>
      <Workspace />
    </LanguageProvider>
  </PlainProvider>,
);
