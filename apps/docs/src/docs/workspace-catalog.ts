import type { ComponentDefinition, PropDefinition } from './catalog';
import { chartSampleData } from './chart-samples.ts';

const p = (
  name: string,
  type: string,
  description: string,
  defaultValue?: string,
): PropDefinition => ({ name, type, description, defaultValue });
const chartEntry = { entry: '@plain/ui/charts', stylesheet: '@plain/ui/charts.css' };
export const workspaceComponents: ComponentDefinition[] = [
  {
    slug: 'language-provider',
    name: 'Language provider',
    category: 'Layout',
    description:
      'Typed component translations, locale formatting, and direction without application-specific strings.',
    imports: ['LanguageProvider', 'DatePicker', 'Pagination'],
    functionSetup: 'const [page, setPage] = React.useState(1);',
    code: '<LanguageProvider locale="ar" timeZone="Africa/Cairo">\n  <div lang="ar" dir="rtl" style={{ display: "grid", gap: 16, width: "100%", maxWidth: 320 }}>\n    <DatePicker defaultValue={new Date(2026, 9, 5)} />\n    <Pagination page={page} pageCount={5} onPageChange={setPage} />\n  </div>\n</LanguageProvider>',
    props: [
      p(
        'locale / timeZone / dir',
        'string / string / ltr | rtl',
        'Formatting locale, optional IANA timezone, and direction. Nested providers inherit unset settings.',
        'en / local timezone / inferred',
      ),
      p(
        'messages',
        'TranslationMessages',
        'Partial typed overrides. A message can be a string or a function of values and locale.',
      ),
      p(
        'translations',
        'Record<string, TranslationMessages>',
        'Locale dictionaries inherited by nested providers; exact locale overrides base language.',
      ),
      p(
        'useTranslation / useLanguage',
        'hook',
        'Read t(key, values), locale, timezone, and direction. Missing keys fall back to English.',
      ),
    ],
    accessibility:
      'Accessible control names, visible labels and validation messages share the translation provider. Set lang and dir on the application HTML or scoped DOM boundary. Built-in English and Arabic dictionaries are available; other locales use supplied dictionaries and Intl formatting.',
  },
  {
    slug: 'chips',
    name: 'Chips',
    category: 'Forms',
    description:
      'Selectable, removable, or action chips with controlled groups and independent remove controls.',
    imports: ['Chip', 'ChipGroup'],
    code: '<ChipGroup aria-label="Project status" defaultValue={["active"]}>\n  <Chip value="active">Active</Chip><Chip value="review">In review</Chip><Chip value="done">Complete</Chip>\n</ChipGroup>',
    props: [
      p(
        'ChipGroup.type / value / onValueChange',
        'single | multiple / string[] / (value) => void',
        'Controlled or uncontrolled selection.',
        'multiple',
      ),
      p(
        'behavior',
        'selection | action',
        'Selection exposes aria-pressed; action runs your native onClick.',
        'selection',
      ),
      p('variant / size', 'outlined | filled / sm | md', 'Token-based treatment and density.'),
      p(
        'onRemove / removeLabel',
        '() => void / string',
        'An independent sibling remove button, never a nested button.',
      ),
      p(
        'startIcon / endIcon / showCheck',
        'ReactNode / ReactNode / boolean',
        'Leading, trailing, and selection affordances.',
      ),
    ],
    accessibility:
      'Chips are native buttons. Arrow keys, Home and End move focus within a group; Space and Enter activate. Remove buttons stay separately focusable. Disabled state applies to the group and its chips.',
  },
  {
    slug: 'search-view',
    name: 'Search view',
    category: 'Overlays',
    description:
      'A composable docked, modal, or fullscreen search surface with local or remote results.',
    imports: ['SearchView', 'CommandItem', 'CommandEmpty', 'CommandGroup'],
    code: '<SearchView label="Search workspace" variant="modal">\n  {({ close }) => <><CommandEmpty>No projects found.</CommandEmpty><CommandGroup heading="Projects"><CommandItem onSelect={close}>Website redesign</CommandItem><CommandItem onSelect={close}>Mobile experience</CommandItem></CommandGroup></>}\n</SearchView>',
    props: [
      p(
        'variant',
        'docked | modal | fullscreen',
        'Docked popover or a focus-trapped dialog; modal expands on small screens.',
        'modal',
      ),
      p(
        'value / onValueChange / open / onOpenChange',
        'controlled state',
        'Own the query and visibility independently.',
      ),
      p(
        'shouldFilter / loading',
        'boolean',
        'Disable local filtering for remote results; expose loading without discarding the input.',
        'true / false',
      ),
      p(
        'children',
        'ReactNode | (context) => ReactNode',
        'Compose CommandItem, CommandGroup, CommandEmpty or custom result content. Context exposes query, setQuery and close.',
      ),
      p(
        'trigger / footer / contentProps / popoverProps',
        'composition slots',
        'Own the launch control, trailing content, and overlay configuration.',
      ),
      p(
        'onSubmit',
        '(query: string) => void',
        'Submit an unselected query without intercepting selected command items.',
      ),
    ],
    accessibility:
      'Uses Command keyboard navigation and Radix overlay focus management. Closing restores trigger focus. Remote results remain application-owned; use shouldFilter=false and cancel stale requests.',
  },
  {
    slug: 'kanban',
    name: 'Kanban',
    category: 'Layout',
    description:
      'Controlled columns and cards with touch, pointer, keyboard, and explicit move commands.',
    imports: ['KanbanBoard', 'type KanbanColumn'],
    entry: '@plain/ui/kanban',
    setup:
      'const initial: KanbanColumn<{ id: string; title: string }>[] = [{ id: "todo", title: "To do", items: [{ id: "a", title: "Customer research" }, { id: "b", title: "Navigation review" }] }, { id: "doing", title: "In progress", items: [{ id: "c", title: "Mobile experience" }] }, { id: "done", title: "Complete", items: [] }];',
    functionSetup: 'const [columns, setColumns] = React.useState(initial);',
    code: '<KanbanBoard columns={columns} onColumnsChange={setColumns} getItemId={item => item.id} getItemLabel={item => item.title} renderCard={item => <strong>{item.title}</strong>} />',
    props: [
      p(
        'columns / onColumnsChange',
        'KanbanColumn<T>[] / (columns, move) => void',
        'Immutable board state and transaction details; omitted callback makes the board read-only.',
      ),
      p(
        'getItemId / getItemLabel / renderCard',
        'typed callbacks',
        'Stable globally unique card IDs, accessible names, and arbitrary card content.',
      ),
      p(
        'canMove',
        '(move: KanbanMove<T>) => boolean',
        'Reject a move before changing application state.',
      ),
      p(
        'renderColumnHeader / renderColumnFooter',
        'slots',
        'Compose counts, lane actions, and creation controls.',
      ),
      p(
        'columnWidth / disabled / onCardClick',
        'number | string / boolean / callback',
        'Responsive lane sizing, read-only mode, and card activation.',
      ),
    ],
    accessibility:
      'Dnd Kit supplies keyboard and touch sensors, focus restoration and drag announcements. Every card also has a move menu for non-drag operation, including empty columns and reordering. Use the content slot without onCardClick when it contains interactive children.',
  },
  ...(['pie', 'radar', 'scatter', 'composed'] as const).map((kind): ComponentDefinition => {
    const name = kind[0].toUpperCase() + kind.slice(1) + 'Chart';
    const setup =
      kind === 'pie'
        ? 'const data = [{ name: "Active", value: 18 }, { name: "Review", value: 8 }, { name: "Complete", value: 24 }];'
        : kind === 'scatter'
          ? 'const data = [{ hours: 2, points: 8 }, { hours: 3, points: 14 }, { hours: 5, points: 18 }, { hours: 7, points: 30 }, { hours: 9, points: 35 }];'
          : `const data = ${JSON.stringify(chartSampleData, null, 2)};`;
    return {
      slug: `${kind}-chart`,
      name: `${kind[0].toUpperCase() + kind.slice(1)} chart`,
      category: 'Charts',
      description:
        'Responsive themed charting with native engine configuration and a P.UI Table alternative.',
      imports: [name],
      ...chartEntry,
      setup,
      code: `<${name} data={data} label="${kind === 'scatter' ? 'Effort and results' : 'Workspace comparison'}" height={280} dataTable="visible" ${kind === 'pie' ? '' : kind === 'scatter' ? 'xKey="hours" yKey="points"' : `index="month" series={[{ dataKey: "revenue", label: "Revenue"${kind === 'composed' ? ', type: "bar"' : ''} }, { dataKey: "costs", label: "Costs"${kind === 'composed' ? ', type: "line"' : ''} }]}`} />`,
      props: [
        p(
          'data / series / index',
          'typed records and series',
          'Choose the plotted values. Composed series accept type=area, bar or line; Scatter uses xKey and yKey.',
        ),
        p(
          'chartProps',
          'native Recharts props',
          'Configure the chart engine without copying styles.',
        ),
        p(
          kind === 'pie'
            ? 'pieProps / innerRadius / outerRadius'
            : kind === 'radar'
              ? 'radarProps / angleAxis / radiusAxis'
              : kind === 'scatter'
                ? 'scatterProps / xAxis / yAxis'
                : 'lineProps / barProps / areaProps',
          'native engine configuration',
          'Advanced plot, axis, label and interaction configuration.',
        ),
        p(
          'config / tooltip / dataTable / animate',
          'Chart configuration',
          'Semantic colors, tooltip content, readable values, and motion policy.',
        ),
      ],
      accessibility:
        'Native chart keyboard access is paired with a semantic P.UI Table. Provide clear labels and meaningful series names. Do not rely on color alone; the visible data alternative works without a pointer.',
    };
  }),
  {
    slug: 'heatmap-chart',
    name: 'Heatmap chart',
    category: 'Charts',
    description:
      'Indexed intensity cells with configurable scales, keyboard selection, and a readable table.',
    imports: ['HeatmapChart'],
    ...chartEntry,
    setup:
      'const data = ["Mon", "Tue", "Wed", "Thu", "Fri"].flatMap((x, i) => ["Design", "Engineering", "Operations"].map((y, j) => ({ x, y, value: (i + j * 3) % 9 + 1 })));',
    code: '<HeatmapChart data={data} label="Workload by team" cellSize={40} showValues dataTable="visible" />',
    props: [
      p(
        'data / xLabels / yLabels',
        'HeatmapDatum[] / string[] / string[]',
        'Cells, order and explicit sparse axes.',
      ),
      p(
        'domain / colorScale',
        '[min, max] / (value, domain) => string',
        'Scale the semantic palette or supply an application color function.',
      ),
      p('formatX / formatY / formatValue', 'format callbacks', 'Localized axis and value labels.'),
      p(
        'cellSize / labelWidth / showValues',
        'number / number / boolean',
        'Stable cell dimensions and labels.',
      ),
      p(
        'onCellClick',
        '(datum) => void',
        'Opt into an arrow-navigable interactive grid; otherwise render a read-only table.',
      ),
      p(
        'legend / dataTable / loading',
        'configuration',
        'Legend, P.UI Table alternative and loading state.',
      ),
    ],
    accessibility:
      'Interactive cells have a roving tab stop, RTL-aware arrows, and full value names. Missing cells remain navigable but cannot activate. Read-only cells are not fake buttons. A semantic table is supplied by default.',
  },
  {
    slug: 'gantt-chart',
    name: 'Gantt chart',
    category: 'Charts',
    description:
      'A virtualized task timeline with progress, dependencies, date scales, and controlled editing.',
    imports: ['GanttChart'],
    ...chartEntry,
    setup:
      'const tasks = [{ id: "research", label: "Customer research", start: "2026-10-01", end: "2026-10-08", progress: 100 }, { id: "design", label: "Design system", start: "2026-10-07", end: "2026-10-18", progress: 65, dependencies: ["research"] }, { id: "build", label: "Implementation", start: "2026-10-15", end: "2026-10-29", progress: 20, dependencies: ["design"] }, { id: "launch", label: "Launch", start: "2026-10-28", end: "2026-11-02", progress: 0, dependencies: ["build"] }];',
    code: '<GanttChart tasks={tasks} label="Project delivery" scale="day" height={280} dataTable="visible" />',
    props: [
      p(
        'tasks / start / end',
        'GanttTask<T>[] / ISO date / ISO date',
        'Stable IDs and date-only intervals. End is exclusive. Invalid intervals are omitted.',
      ),
      p(
        'scale / dayWidth / rowHeight / labelWidth / height',
        'day | week | month / number',
        'Density and viewport dimensions; month ticks follow actual month boundaries. Omit labelWidth for adaptive task labels (96-184px); set a number for a fixed width.',
      ),
      p(
        'onTaskClick / renderTask / renderLabel',
        'callbacks and slots',
        'Own task details, labels and bar content.',
      ),
      p(
        'onTaskChange',
        '(task, previous, reason) => void',
        'Controlled date edits: Alt+Arrow moves by a day; Alt+Shift+Arrow resizes. Direction follows RTL.',
      ),
      p(
        'showDependencies / dataTable',
        'boolean / visible | sr-only | false',
        'Dependencies are drawn between currently visible rows. Data table defaults to sr-only; use paginated external data alternatives for very large task sets.',
      ),
    ],
    accessibility:
      'Rows and axis ticks are virtualized with stable IDs. Keyboard edits never mutate task props. Read-only bars expose their task interval; a P.UI Table supplies a nonvisual alternative. Application state owns edits and task dialogs.',
  },
  {
    slug: 'calendar-event-dialog',
    name: 'Calendar event dialog',
    category: 'Scheduling',
    description:
      'An optional event editor with async saving and composable fields, separate from the scheduling engine.',
    imports: ['CalendarEventDialog'],
    entry: '@plain/ui/full-calendar',
    setup: "import { Button } from '@plain/ui';",
    functionSetup: 'const [open, setOpen] = React.useState(false);',
    code: '<Button onClick={() => setOpen(true)}>New event</Button>\n<CalendarEventDialog open={open} onOpenChange={setOpen} selection={{ start: "2026-10-05T09:00", end: "2026-10-05T10:00", allDay: false, view: "week" }} onSave={async (draft) => { console.log(draft); }} />',
    props: [
      p(
        'open / onOpenChange / event / selection',
        'controlled state and editor input',
        'Edit an event or initialize a new draft from a selected slot. Drafts are initialized once per open session; close/reopen or key the dialog to switch drafts while open.',
      ),
      p(
        'onSave',
        '(draft, event?) => void | Promise<void>',
        'Application-owned persistence; errors stay visible and successful saves close the editor.',
      ),
      p(
        'renderFields / renderFooter',
        'composition slots',
        'Add arbitrary app fields or replace the footer. Never depend on an embedded calendar form.',
      ),
      p(
        'timeZone',
        'string',
        'Normalize Date and instant inputs into an IANA timezone. Defaults to the language provider or local zone.',
      ),
      p(
        'contentProps / title / description / disabled',
        'overlay configuration',
        'Configure the accessible dialog and disabled behavior.',
      ),
    ],
    accessibility:
      'Focus-trapped dialog with labeled P.UI inputs and pickers, native required title validation, localized interval validation, and announced async errors. All-day dates use an exclusive end.',
  },
];
