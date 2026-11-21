import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as UI from '@plain/ui';
import '@plain/ui/styles.css';

const query = new URLSearchParams(location.search);
const variants: UI.InputVariant[] = ['outlined', 'filled', 'ghost', 'contrast'];
const options = [
  { value: 'design', label: 'Design' },
  { value: 'engineering', label: 'Engineering' },
];
const day = new Date(2026, 10, 21);

function Fields({ variant }: { variant: UI.InputVariant }) {
  const props = { variant, disabled: query.has('disabled'), 'aria-invalid': query.has('invalid') };
  const fields = [
    ['input', <UI.Input {...props} name="project" defaultValue="Project Atlas" />],
    [
      'textarea',
      <UI.Textarea {...props} name="notes" defaultValue="Notes for the team" rows={2} />,
    ],
    ['number', <UI.NumberInput {...props} name="seats" defaultValue={5} />],
    ['search', <UI.SearchInput {...props} name="query" defaultValue="Project" />],
    ['password', <UI.PasswordInput {...props} name="password" defaultValue="project-secret" />],
    ['pin', <UI.PinInput {...props} name="code" defaultValue="123" />],
    ['tags', <UI.TagsInput {...props} name="tags" defaultValue={['Design', 'Research']} />],
    [
      'multi-select',
      <UI.MultiSelect {...props} name="teams" options={options} defaultValue={['design']} />,
    ],
    [
      'select',
      <UI.Select defaultValue="design" disabled={props.disabled}>
        <UI.SelectTrigger {...props} aria-label={`select ${variant}`}>
          <UI.SelectValue />
        </UI.SelectTrigger>
        <UI.SelectContent>
          <UI.SelectItem value="design">Design</UI.SelectItem>
          <UI.SelectItem value="engineering">Engineering</UI.SelectItem>
        </UI.SelectContent>
      </UI.Select>,
    ],
    ['combobox', <UI.Combobox {...props} name="owner" options={options} defaultValue="design" />],
    ['color', <UI.ColorPicker {...props} name="color" defaultValue="#252826" />],
    ['date', <UI.DatePicker {...props} name="due" defaultValue={day} />],
    [
      'date-range',
      <UI.DateRangePicker
        {...props}
        name="travel"
        defaultValue={{ from: day, to: new Date(2026, 10, 25) }}
      />,
    ],
    ['time', <UI.TimePicker {...props} name="start" defaultValue="09:30" />],
    ['date-time', <UI.DateTimePicker {...props} name="meeting" defaultValue="2026-11-21T09:30" />],
    [
      'time-range',
      <UI.TimeRangePicker {...props} name="hours" defaultValue={{ from: '09:00', to: '17:00' }} />,
    ],
    [
      'date-time-range',
      <UI.DateTimeRangePicker
        {...props}
        name="event"
        defaultValue={{ from: '2026-11-21T09:00', to: '2026-11-25T17:00' }}
      />,
    ],
    ['file-upload', <UI.FileUpload {...props} name="files" />],
    ['dropzone', <UI.Dropzone {...props} name="documents" description="PDF or text files" />],
    [
      'command',
      <UI.Command>
        <UI.CommandInput {...props} aria-label={`command ${variant}`} />
        <UI.CommandList>
          <UI.CommandItem>Open project</UI.CommandItem>
          <UI.CommandItem>View activity</UI.CommandItem>
        </UI.CommandList>
      </UI.Command>,
    ],
  ] as const;
  return (
    <section aria-label={variant} style={{ minWidth: 0 }}>
      <h2 style={{ fontSize: 20, marginBottom: 24 }}>{variant}</h2>
      <form style={{ display: 'grid', gap: 24 }} onSubmit={(event) => event.preventDefault()}>
        {fields
          .filter(([kind]) => !query.has('field') || kind === query.get('field'))
          .map(([kind, control]) => (
            <div key={kind} data-testid={`${kind}-${variant}`} style={{ minWidth: 0 }}>
              {kind === 'select' || kind === 'command' ? (
                <>
                  <p style={{ fontSize: 14, marginBottom: 8 }}>{kind}</p>
                  {control}
                </>
              ) : (
                <UI.Field label={`${kind} ${variant}`}>{control}</UI.Field>
              )}
            </div>
          ))}
      </form>
    </section>
  );
}

function Matrix() {
  return (
    <main style={{ margin: '0 auto', maxWidth: 1440, padding: 16 }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Input appearances</h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 32,
        }}
      >
        {variants
          .filter((variant) => !query.has('variant') || variant === query.get('variant'))
          .map((variant) => (
            <Fields key={variant} variant={variant} />
          ))}
      </div>
      <UI.ThemeScope
        mode="light"
        style={{ background: 'var(--ui-background)', color: 'var(--ui-foreground)', padding: 16 }}
        tokens={{
          'muted-foreground': '#46515a',
          'input.filled-background': '#dce8f0',
          'input.ghost-hover': '#dce8f0',
          'input.contrast-border': '#35709a',
        }}
      >
        <div data-testid="scoped" style={{ marginTop: 32, display: 'grid', gap: 24 }}>
          <UI.Field label="Scoped search">
            <UI.SearchInput variant="filled" />
          </UI.Field>
          <UI.Field label="Scoped PIN">
            <UI.PinInput variant="filled" />
          </UI.Field>
          <UI.Field label="Scoped date">
            <UI.DatePicker variant="filled" />
          </UI.Field>
        </div>
      </UI.ThemeScope>
      <UI.SearchView inputVariant="filled" label="Search workspace">
        <UI.CommandItem>Open project</UI.CommandItem>
      </UI.SearchView>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UI.PlainProvider
      persist={false}
      dir={query.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
      theme={{ mode: query.get('theme') === 'dark' ? 'dark' : 'light', motion: 'none' }}
    >
      <Matrix />
    </UI.PlainProvider>
  </React.StrictMode>,
);
