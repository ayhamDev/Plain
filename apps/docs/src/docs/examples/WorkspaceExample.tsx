import * as React from 'react';
import * as UI from '@plain/ui';
const WorkspaceCharts = React.lazy(() => import('./WorkspaceCharts'));
const KanbanExample = React.lazy(() => import('./KanbanExample'));
const EventEditor = React.lazy(() => import('./EventEditorExample'));
type State = Record<string, string | number | boolean>;

export default function WorkspaceExample({ slug, state = {} }: { slug: string; state?: State }) {
  const [chipValues, setChipValues] = React.useState(['active']);
  const [locale, setLocale] = React.useState('ar');
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState('');
  const mode =
    state.variant === 'docked' || state.variant === 'fullscreen' ? state.variant : 'modal';
  if (slug.endsWith('-chart'))
    return (
      <React.Suspense fallback={<UI.Spinner />}>
        <WorkspaceCharts slug={slug} state={state} />
      </React.Suspense>
    );
  if (slug === 'kanban')
    return (
      <React.Suspense fallback={<UI.Spinner />}>
        <KanbanExample state={state} />
      </React.Suspense>
    );
  if (slug === 'calendar-event-dialog')
    return (
      <React.Suspense fallback={<UI.Spinner />}>
        <EventEditor />
      </React.Suspense>
    );
  if (slug === 'language-provider')
    return (
      <UI.Stack gap={2} style={{ width: '100%', maxWidth: 360 }}>
        <UI.Select value={locale} onValueChange={setLocale}>
          <UI.SelectTrigger aria-label="Language">
            <UI.SelectValue />
          </UI.SelectTrigger>
          <UI.SelectContent>
            <UI.SelectItem value="en">English</UI.SelectItem>
            <UI.SelectItem value="ar">العربية</UI.SelectItem>
          </UI.SelectContent>
        </UI.Select>
        <UI.LanguageProvider locale={locale} timeZone="Africa/Cairo">
          <div lang={locale} dir={UI.languageDirection(locale)}>
            <UI.DatePicker defaultValue={new Date(2026, 9, 5)} />
            <UI.Pagination
              style={{ marginTop: 16 }}
              page={page}
              pageCount={5}
              onPageChange={setPage}
            />
          </div>
        </UI.LanguageProvider>
      </UI.Stack>
    );
  if (slug === 'chips')
    return (
      <UI.Stack gap={2}>
        <UI.ChipGroup
          aria-label="Project status"
          value={chipValues}
          onValueChange={setChipValues}
          type={state.type === 'single' ? 'single' : 'multiple'}
          disabled={!!state.disabled}
        >
          {['active', 'review', 'done'].map((value, i) => (
            <UI.Chip
              key={value}
              value={value}
              variant={state.variant === 'filled' ? 'filled' : 'outlined'}
              size={state.size === 'sm' ? 'sm' : 'md'}
            >
              {['Active', 'In review', 'Complete'][i]}
            </UI.Chip>
          ))}
        </UI.ChipGroup>
        <UI.Small tone="muted" role="status">
          {chipValues.length ? chipValues.join(', ') : 'None selected'}
        </UI.Small>
      </UI.Stack>
    );
  return (
    <UI.Stack gap={2}>
      <UI.SearchView label="Search workspace" variant={mode} loading={!!state.loading}>
        {({ close }) => (
          <>
            <UI.CommandEmpty>No projects found.</UI.CommandEmpty>
            <UI.CommandGroup heading="Projects">
              {['Website redesign', 'Mobile experience', 'Component library'].map((name) => (
                <UI.CommandItem
                  key={name}
                  onSelect={() => {
                    setSelected(name);
                    close();
                  }}
                >
                  {name}
                </UI.CommandItem>
              ))}
            </UI.CommandGroup>
          </>
        )}
      </UI.SearchView>
      <UI.Small role="status" tone="muted">
        {selected}
      </UI.Small>
    </UI.Stack>
  );
}
