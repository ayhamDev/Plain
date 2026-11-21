# P.UI / @plain/ui

Neutral React and TypeScript components for prototypes and production web apps.
This package is developed in the P.UI monorepo under `packages/ui`; documentation
and application examples live separately in `apps/docs` and are not library
exports.

## Use

React and React DOM 18.3 or 19 are peers. Import compiled CSS once. Consumers do
not need Tailwind or a downloaded font.

```tsx
import { PlainProvider, Button, Field, Input } from '@plain/ui';
import '@plain/ui/styles.css';

export function Example() {
  return (
    <PlainProvider>
      <Field label="Project name">
        <Input name="project" />
      </Field>
      <Button>Save changes</Button>
    </PlainProvider>
  );
}
```

The original hand-authored neutral light/dark palette is the default. Brand
generation is opt-in. Components support typed styles, tokens, unstyled behavior,
native props/refs and direction-aware composition.

Input, Textarea and SelectTrigger retain their resting border on focus. The outer
focus outline remains visible and uses `input.focus` or `select.focus`; error
styling and explicitly chosen contrast variants remain available. Filled, ghost
and theme-borderless fields do not gain a border when focused.

## Global localization

Configure language once on `PlainProvider`. All built-in text uses the same
context: calendar and time controls, table tools and pagination, search, inputs,
file uploads, dialogs, notifications, navigation, charts and other internal
labels, validation and announcements. Portals retain the provider's context.

```tsx
import { PlainProvider, ThemeScope, DatePicker, type TranslationMessages } from '@plain/ui';
import type { ReactNode } from 'react';

const french: TranslationMessages = {
  'picker.chooseDate': 'Choisir une date',
  'table.search': 'Rechercher…',
  'table.rowsPerPage': 'Lignes par page',
  'collection.selected': ({ count }, locale) =>
    `${new Intl.NumberFormat(locale).format(Number(count))} sélectionné(s)`,
};

export function AppProviders({ children, locale }: { children: ReactNode; locale: string }) {
  return (
    <PlainProvider locale={locale} timeZone="Europe/Paris" translations={{ fr: french }}>
      {children}
      <ThemeScope locale="ar-EG" messages={{ 'picker.chooseDate': 'اختر موعداً' }}>
        <DatePicker />
      </ThemeScope>
    </PlainProvider>
  );
}
```

English and Arabic dictionaries are built in. Supply typed `translations` for
other languages; missing keys fall back to the built-in language, then English.
Locale tags are canonicalized. Dictionaries merge from base language through
script/region to the exact tag. Nested providers merge each dictionary's keys;
`messages` supplies explicit inherited overrides. Changing locale updates mounted
controls while retaining their values and table state. A function message receives
raw placeholder values and the locale for application-owned plural rules. Numeric
placeholders in string messages use `Intl.NumberFormat` automatically.

`PlainProvider` synchronizes the document's `lang` and `dir` on the client and
restores them when removed. Direction follows the locale unless `dir` is explicit.
For SSR, set the server-rendered `<html lang dir>` to match your initial locale.
`ThemeScope` applies language/direction to its own element and portaled descendants
without changing the document. `LanguageProvider` / `TranslationProvider` remain
available independently; they provide context without adding an element or changing
document attributes. Use `useTranslation` / `useLanguage` for `t`, `locale`,
`timeZone` and `dir`; `dateFormatter` and `numberFormatter` are cached Intl helpers.

Calendar display names, weeks, dates and numeric summaries follow Intl. Choose a
region or numbering extension when needed, such as `ar-EG` or `ar-u-nu-latn`.
The default calendar engine lays out Gregorian months; its labels use that same
calendar. Explicit component labels, native props and formatter overrides remain
authoritative. Application content, data-column labels, options and toast messages
are application-owned; browser-native validation and file chooser text follow the
browser. Week starts, business hours and data/timezone policy remain explicit.

## Override one component

Use typed component tokens on the native `style` prop to override a single
instance, independently of the global theme:

```tsx
import { Input, Switch, ThemeScope, extendComponent, tokensToStyle } from '@plain/ui';

<Switch aria-label="Notifications" style={tokensToStyle({ 'switch.radius': '999px' })} />;

<Input
  aria-label="Project name"
  style={tokensToStyle({
    'input.radius': '12px',
    'input.height': '48px',
    'input.border': 'var(--ui-outline)',
  })}
/>;

// Reuse the same defaults; caller style still wins.
const RoundSwitch = extendComponent(Switch, {
  tokens: { 'switch.radius': '999px' },
});

// A group, including descendant menus/dialogs/popovers opened through portals.
<ThemeScope tokens={{ 'button.radius': '999px', 'popover.radius': '16px' }}>
  <YourSettings />
</ThemeScope>;
```

Token values are CSS strings. Choose component aliases such as `switch.radius`
for one instance; a root `radius` override on a control does not recalculate
aliases already inherited from an ancestor. Switch thumbs automatically derive
their rounding from the local track radius. Set `switch.thumb-radius` separately
when needed; `initial` restores automatic rounding. Other exposed tokens cover
component colors, borders, shadows, sizes and motion. Keep color overrides readable
in both modes. Native refs, handlers, disabled state and form behavior remain intact.

## Optional Entries

- `@plain/ui/charts` with `@plain/ui/charts.css`: charts, heatmap and Gantt.
- `@plain/ui/full-calendar` with `@plain/ui/full-calendar.css`: scheduling and an
  optional composable event editor.
- `@plain/ui/kanban`: controlled drag-and-drop lanes.
- `@plain/ui/motion`: optional lazy motion.
- `@plain/ui/qr-code`: the SVG QRCode component and its types.
- `/layout`, `/sidebar`, `/virtual`, `/advanced`, `/date-time`, `/typography`,
  `/i18n`, `/chips`, `/list`, `/search-view`, `/data-table`, `/forms`, `/overlays`, `/theme`
  and other declared exports provide modular entry points.

Heavy chart, scheduling, Kanban and motion implementations stay outside the core
barrel. Calendar editing, server filtering and persistence remain application
responsibilities. Custom themes/renderers require application accessibility QA.

## Data table controls in your page layout

Create one controller in a common owner and pass it to the table and controls.
They can live in separate components, an app header, a side panel or a footer;
they do not require a DataTable parent or a provider.

```tsx
import {
  useDataTable,
  DataTableView,
  DataTableSearch,
  DataTableFilters,
  DataTableSort,
  DataTableColumns,
  DataTableReset,
  DataTableActiveFilters,
  DataTablePagination,
  type DataTableColumn,
  type DataTableFilterField,
} from '@plain/ui'; // also @plain/ui/data-table

type Invoice = { id: string; customer: string; amount: number };

export function InvoicePage({
  data,
  columns,
  fields,
}: {
  data: Invoice[];
  columns: DataTableColumn<Invoice>[];
  fields: DataTableFilterField<Invoice>[];
}) {
  const table = useDataTable({
    data,
    columns,
    filterFields: fields,
    getRowId: (row) => row.id,
  });
  return (
    <>
      <header>
        <DataTableSearch table={table} placeholder="Search invoices" />
        <DataTableFilters table={table} fields={fields} />
        <DataTableSort table={table} />
        <DataTableColumns table={table} />
        <DataTableReset table={table} />
      </header>
      <DataTableActiveFilters table={table} fields={fields} />
      <DataTableView table={table} showToolbar={false} showPagination={false} />
      <footer>
        <DataTablePagination table={table} />
      </footer>
    </>
  );
}
```

`showToolbar={false}` removes the built-in top controls. `showPagination={false}`
hides only the built-in pagination UI, preserving paginated rows and external
page controls. `pagination={false}` instead displays all rows. Existing
`DataTableToolbar` can also be placed outside the view as one complete toolbar.
`DataTableFieldFilter table={table} field={field}` binds a single simple filter.
Configure the same filter fields on `useDataTable` and the filter controls for
client filtering. For remote data, pass `useRemoteDataTable(...).table`; its
controlled query, sorting, paging and transport remain the source of truth.

To place selection controls elsewhere, keep `mode` (`browse` or `selection`) in
the page owner and pass it with `onModeChange` to both `DataTableSelectionToggle`
and the selectable table view. `DataTableSelectionActions table={table}` renders
custom children and a clear action when IDs are selected, including selections
on other pages. Exiting selection clears IDs by default; set
`clearSelectionOnExit={false}` on the toggle to retain them.

Search, sorting, column, reset, selection and active-filter controls forward
native props and refs to their input/button/div. Labels and trigger children can
be customized. Typed `data-table.*` slots and `unstyled` remain available. Filters
and sorting keep responsive sheets on mobile. `DataTableReset` clears search and
filters and returns to page one while preserving sorting, columns and selection;
use controller methods in application actions for a different reset policy.
The working docs example is `/components/data-table-controls`.

## Card interactions

Card offers `outlined`, `filled`, `elevated` and `ghost` surfaces. Use `ghost` for
a borderless card. `interactive` adds smooth hover and press tints; `selected`
adds a persistent tint, with stronger feedback while hovering or pressing it.
These states keep the card still and preserve its resting border and elevation.
Description text gains emphasis with the tint to maintain readable contrast.
Keyboard focus keeps its own visible outline. System reduced motion and the
provider's reduced/none policies remove the transition.

Compose a native link or button with `asChild` when the entire card is actionable.
`interactive` is a visual option; it does not add a role, tab stop or click handler.
Keep a card with separate actions as a container, and let those controls retain
their native focus and activation. For selectable cards, provide the appropriate
control semantics (such as `aria-pressed` on a toggle button) and a visible
selection label or checkmark. Existing `card.background`, `card.foreground`,
`card.border`, `card.radius`, styling slots and native `style` overrides apply.

## Layout presence

Layout containers accept `presence` to animate direct keyed children on first
render, insertion and removal. Use stable data IDs as keys; each child should
render one DOM element. Wrap multi-element groups in Box.

```tsx
import { Card, Grid, LayoutPresence } from '@plain/ui';

<Grid
  columns={{ base: 1, sm: 2, lg: 3 }}
  presence={{ preset: 'fade', initial: true, stagger: 32, layout: true }}
>
  {projects.map((project) => (
    <Card key={project.id}>{project.name}</Card>
  ))}
</Grid>;

<LayoutPresence asChild>
  <ul>
    {items.map((item) => (
      <li key={item.id}>{item.label}</li>
    ))}
  </ul>
</LayoutPresence>;
```

The API is shared by Box, Flex, Stack, Inline, Grid, Container, Center, Spacer,
Masonry, Resizable/ResizablePanel, Card/Header/Content/Footer, AspectRatio,
ScrollArea, Collapsible/CollapsibleContent, AccordionContent, TabsContent,
TableHeader/Body/Footer and the sidebar provider, root, header, footer, content,
group, menu and inset. AppShell applies it to main content. LayoutPresence extends
any native or ref-forwarding container through `asChild`, with no extra DOM node.
These APIs and types are also exported from `@plain/ui/layout`.

`presence` defaults to false; LayoutPresence itself defaults to true. Options:

| Option                      | Behavior                                                                  |
| --------------------------- | ------------------------------------------------------------------------- |
| `preset`                    | `fade` (default), `slide`, or `scale`; no hover/press transforms          |
| `initial`                   | Animate the first render (default true); false animates later changes     |
| `duration` / `exitDuration` | Milliseconds; inherit normal/fast scope motion tokens                     |
| `easing` / `distance`       | CSS timing function and slide distance in pixels (default 8)              |
| `stagger`                   | Entrance delay per child in milliseconds, capped at 200ms total           |
| `layout`                    | Opt into position animation on child changes, with batched geometry reads |
| `maxItems`                  | Limit concurrent animations and retained exits (default 50)               |
| `onExitComplete`            | Called after the last retained exit is removed or cancelled               |

Native Web Animations own the frames; React tracks membership and completion.
Static layouts perform no animation/geometry work or preference subscriptions.
Enabled scopes share one system preference listener. Timings respect scoped
motion tokens and provider/system reduced motion. Reduced/none policy, zero
duration or unavailable animation support removes content immediately. Server
HTML stays visible. Exiting elements are inert, hidden from assistive technology
and excluded from form submission; reintroducing a key preserves its local state.

Nested scopes are independent. Prefer one scope per changing collection. Engine
opening/closing and virtualized window lifecycles remain engine-owned: use a
stable application content scope rather than retaining virtual rows. Portals and
children without a single DOM root safely skip animation. The working example is
`/docs/layouts#layout-presence`.

## Time pickers

DatePicker, DateRangePicker, TimePicker, DateTimePicker and their range variants open a bottom sheet below
768px. The default `pickerMode="auto"` uses iOS-style wheels on compact screens
and select controls in a desktop popover. Set `pickerMode="select"` or `"wheel"`
to choose the time controls explicitly; compact screens still use a sheet.
Click the field, or press Enter, Space or an arrow key, to open the picker.
An open surface stays stable across screen rotation; the next opening follows
the new viewport size. Minute choices default to every minute.

```tsx
import { Field, TimePicker } from '@plain/ui';

<Field label="Start time">
  <TimePicker defaultValue="16:07" hour12 popoverProps={{ align: 'start', collisionPadding: 12 }} />
</Field>;

<TimePicker defaultValue="16:07" hour12={false} />; // 24-hour field and picker
<TimePicker defaultValue="09:15" minuteStep={5} />; // Explicit five-minute choices
<TimePicker defaultValue="09:15" editable />; // Opt into native keyboard editing
```

`hour12` selects AM/PM; `hour12={false}` selects 24-hour time. It takes precedence
over `hourCycle="h12" | "h23"`, whose default remains `h23`. The default field and
picker use the same localized format. With `editable`, the browser controls the
native editor's display format; use the icon or Alt+ArrowDown to open the picker.
These settings also apply to DateTimePicker and both time range variants.

Touch gestures retain native scrolling and inertia. Mouse-wheel notches advance
one row, while small trackpad deltas accumulate smoothly. Wheel values commit
when the gesture settles; Done accepts any pending column changes together.
Each column also supports Arrow Up/Down, Page Up/Down and Home/End. Seconds appear
when present in the value. Values remain ISO wall-time strings in the actual
native input: refs, change events, forms, bounds and controlled state remain
available. Clear and form reset discard pending gestures. Done restores field
focus. Date/time sheets use two steps: choose a date, press Next, then choose the
time. Back retains the draft; Done commits both parts together. Cancel, Escape,
outside dismissal and reset discard the unconfirmed date/time draft. Each endpoint
of DateTimeRangePicker uses the same flow. Standalone TimePicker keeps its live
time updates. Wheel gestures do not drag the sheet.

Mobile date-only sheets have a larger date summary, full-width touch calendar and
fixed Cancel/Done actions. DateRangePicker shows two vertically stacked months
by default, with pending start/end summaries; set `calendarProps.numberOfMonths`
to customize that count. Dates remain pending until Done. Desktop date pickers
keep their existing popovers and immediate selection behavior. Short screens use
compact headers and three visible wheel rows while keeping the selected row and
actions reachable. Internal labels and step counts use the language provider.

Desktop popovers anchor to the whole field and fit the available viewport. Use
`popoverProps` for placement, collision boundaries, sizing or native popover
handlers. Compact screens retain a bottom sheet regardless of desktop placement.

Use ThemeScope/PlainProvider tokens for scoped portal overrides:
`temporal.wheel-row-height` (48px by default, minimum visual height 44px),
`temporal.wheel-selection`, `temporal.wheel-foreground` and `temporal.wheel-muted`.
Typed `temporal.field`, `temporal.display`, `temporal.wheel*`, `temporal.mobile-panel`
and `temporal.mobile-body` slots
support custom classes. Neutral light/dark styling, RTL, localized numerals,
reduced motion and unstyled composition follow the existing library contract.
Custom unstyled wheels need application CSS for their scrolling geometry.

## QR code

```tsx
import { QRCode } from '@plain/ui'; // also @plain/ui/qr-code

<QRCode
  value="https://github.com/ayhamDev/Plain"
  label="Open the P.UI repository"
  size={192}
  level="M"
  margin={4}
/>;
```

QRCode uses the `qrcode` encoder locally and renders SVG during SSR and in the
browser. `value` is encoded exactly, including Unicode and whitespace. `level`
supports L/M/Q/H, defaulting to M or H with a logo. Explicit levels take precedence.
The margin is measured in modules and normalized to 4..128. Square codes keep a
four-module quiet zone; integrated circles put the margin around the full circular
silhouette. Defaults keep black ink on white paper in both themes. RTL does not
mirror the code.

A 1000ms draw animation runs on mount and content changes by default. The corner
markers trace into place, then alternating strokes write the pattern like ink.
The finished code stays still. Set timing with
`animation={{ preset: 'draw', duration: 900, delay: 80 }}` or disable it with
`animation={false}` (also `duration: 0`). The previous `assemble`, `scan`, `reveal`
and `fade` names are compatibility aliases for `draw`; their old effects have
been removed. System reduced-motion preferences and provider `reduced`/`none`
policies disable the animation. Timing uses the library easing and motion scale,
with local `qr-code.duration` and `qr-code.delay` token overrides.
The SVG mask uses at most 48 writing strokes, even for dense matrices, with no
per-module animation or JavaScript animation loop. Gradients, custom modules,
logos and the quiet zone retain their original geometry. Downloaded SVGs remain
complete even when exported during drawing. The `qr-code.draw-stroke`,
`draw-anchor`, `draw-center` and `draw-complete` styling slots replace the former
`motion-tile`, `motion-anchor` and `scan` slots.

```tsx
<QRCode
  value="https://github.com/ayhamDev/Plain"
  label="Open the P.UI repository"
  shape="circle"
  size={320}
  moduleShape="dots"
  finderShape="dots"
  finderCenterShape="circle"
  finderColor="#111827"
  gradient={{
    type: 'linear',
    rotation: 45,
    stops: [
      { offset: 0, color: '#111827' },
      { offset: 1, color: '#3730a3' },
    ],
  }}
  logo={{ src: '/brand.svg', size: 0.18, padding: 1, radius: 0.5 }}
/>
```

`shape="circle"` uses one aligned dot field with round dotted finder rings and
solid round centers. The encoded square stays complete and takes more of the
available space; outer dots continue its grid, with a light separator around each
finder. Data dots default to 90% scale. The outer field inherits the data gradient
or foreground; `circlePatternColor` can override it.

`circlePattern={true}` and `"integrated"` select this continuous composition.
Use `circlePattern="separated"` to retain the original blank square quiet zone,
or `false` for a plain circular background. An integrated circle fills beside the
matrix and therefore differs from the standard
[four-module square quiet zone](https://www.qrcode.com/en/howto/code.html/index.html).
Use the square or separated layout when that margin is required. Encoded corners
are never cropped. Increase `size` for dense content and test the intended output.

`moduleShape` accepts square, rounded, dots and diamond, with `moduleScale` in
0.6..1 (default 1, or 0.9 in circles). `finderShape` and `finderCenterShape` accept
square, rounded, circle and dots. Dotted finder rings keep a solid round center;
`dots` on a center also means a solid round dot. Other finder
centers inherit the outer shape. Override centers/colors with
`finderCenterShape`/`finderCenterColor`. Explicit `foreground`/`background` or
typed `qr-code.foreground`/`qr-code.background` tokens customize ink and paper.
`gradient` supports linear/radial, rotation and up to 16 stops (offset 0..1,
color, optional opacity). Function patterns keep solid foreground ink.

`logo` accepts src, size (matrix fraction 0..0.24; default 0.18), padding
(modules 0..4; default 1), background, radius (modules; default 0.5), and
crossOrigin. Its cutout preserves reserved light and dark function cells.
Use an embedded data URL for a portable standalone logo export. Custom colors,
small modules and logos need scanning checks with your content at the intended
display/print size.

Advanced consumers can set `qrVersion` (1..40) and `maskPattern` (0..7).
Native SVG `version` remains separate. `renderModule(module, defaultElement)`
receives x/y, size: 1 and isFunction, using matrix coordinates.
`renderFinder(finder, defaultElement)` receives corner, x/y and size: 7; its
returned SVG uses local 0..7 coordinates. Both callbacks are clipped to the
matrix to retain its bounds and surrounding layout. Default rendering combines modules into a
few paths; custom module rendering opts into individual DOM nodes.

Native SVG refs, attributes, handlers, classes and style target the actual SVG.
Typed `qr-code.*` slots customize its background, data/function paths, finder
frames/centers, outer circle, logo and animation parts. Unstyled mode removes
default classes/animation while retaining SVG geometry and ink/paper defaults. Empty values show
an empty placeholder. Encoder failures show an unavailable placeholder and call
`onEncodingError`; neither state renders a fake code. `data-state` reports ready,
empty or error. Provide meaningful `label`/`description` or native ARIA props, with
equivalent text or a link alongside the image. Download actions belong to the
application; the docs example demonstrates exporting a complete static SVG with
resolved colors, gradient definitions and an embedded logo, plus interactive
style, color and animation controls.

## Dropzone

`Dropzone` is available from `@plain/ui` and `@plain/ui/advanced`. Its entire drop
surface is a native file input, so pointer browsing, keyboard selection, labels,
required validation, refs and `FormData` work with the same control.

```tsx
import { Dropzone } from '@plain/ui';

<Dropzone
  name="documents"
  aria-label="Project documents"
  accept=".pdf,.txt"
  multiple
  maxFiles={5}
  maxSize={5000000}
  label="Add project documents"
  description="PDF or text files, up to 5 files, 5 MB each."
  onFilesChange={(files) => console.log(files)}
/>;
```

Selections replace the previous batch. Invalid batches preserve it and show
announced feedback for type, size or count rejections. `value`/`defaultValue`
support controlled and uncontrolled files; `onValueChange` and `onFilesChange`
report browsing, dropping and removal. Native `onChange` reports picker events.
Prevent the native `onChange` or `onDrop` event to cancel the corresponding commit.
Form reset restores the controlled/default files and clears rejection feedback.

Customize `label`, `description`, `icon`, or `children` (a node or render function
receiving `{ files, rejections, dragging, disabled }`). Put interactive actions
outside the native drop area. `showFileList={false}` supports an application-owned
file list. Typed `dropzone.*` slots and theme aliases customize the area, selected
files, radius, colors, focus and minimum height. Token variables on the input's
native `style` also inherit from the wrapper for local overrides. `unstyled`
retains the native picker and selection behavior. Uploading and server validation
remain application responsibilities.

## Composable collections and feedback

`List` and `DataTable` support explicit `browse` and `selection` modes. Use
`selectable defaultMode="browse"` for a Select/Done workflow, or control `mode`
and selection from your application. Table search, filtering, sorting, column
controls, pagination and the entire toolbar can be hidden independently. On
small screens the filter and sort editors use a bottom sheet automatically.
List selection is indicated by the checkbox without a persistent row fill. Enabled
rows retain the same hover treatment in both modes on devices with hover support.
The `data-selected` attribute and render state remain available for customization.
Disabled item text stays readable; its checkbox communicates unavailable selection.
Mobile table sheets keep scrolling inside their content and retain a visible
completion action; sort labels and controls wrap within the sheet width.

Progress allocations share one capacity and retain text labels alongside color:

```tsx
import { Progress } from '@plain/ui';

<Progress
  aria-label="Storage used"
  max={100}
  formatValue={(value) => `${value} GB`}
  segments={[
    { id: 'documents', label: 'Documents', value: 24, color: 'var(--ui-chart-1)' },
    { id: 'images', label: 'Images', value: 32, color: 'var(--ui-chart-2)' },
  ]}
/>;
```

`segments` takes precedence over `value`; `showLegend={false}` hides the visible
legend while retaining the aggregate accessible description. Over-capacity groups
scale proportionally to fit the track. Colors may use semantic tokens or explicit
application colors; verify contrast when overriding them.

`NavigationRail` is a persistent workspace column beside `Sidebar`; `SidebarRail`
remains the collapse-edge control. Tabs, SegmentedControl and BottomNavigation
animate a shared active indicator without introducing an animation-engine dependency.
All default motion respects the provider and system reduced-motion policy.

Sheet/Drawer drag from headers, padding and non-interactive content by default.
Inputs, sliders (including tracks), buttons, links, editable content and nested
scroll regions keep their own gestures. Mouse drags on paragraphs/code select
text, and touch scrolling takes precedence when the panel can scroll in that
direction. Set `handleOnly={true}` to restrict dragging to the handle, or put
`data-vaul-no-drag` on a custom widget/region. Native pointer handlers and
`preventDefault()` on pointer down remain available. Vertical panels include a
handle automatically. Use `maxWidth` with detached or floating bottom sheets
for centered, bounded panels. Toasts include a close button and default to
inverse contrast: dark in light mode and light in
dark mode. Use `<Toaster invert={false} />` for the current surface, or
`closeButton={false}` to hide dismissal. Theme tokens and caller inline styles
continue to control colors and actions.

Attached viewport sheets and drawers keep their background continuous when pulled
past the resting edge. The extension follows the panel's computed background,
including local tokens and inline colors, while native content scrolling, refs,
snap points and controls remain on the original dialog element. Detached/floating
gaps and unstyled/custom-container presentation are retained. The decorative
extension uses the shared `sheet.overflow-fill` styling slot.

Time picker fields stay side by side, including optional period and seconds.
Styled popovers use Radix's available width and height to stay within their
collision boundary, scrolling tall content internally. `PopoverContent` defaults
to `collisionPadding={8}` and `sticky="always"`; native placement/collision props
and consumer class/style overrides remain available. Unstyled consumers own sizing.

Calendars and all date picker popups include direct month/year selectors by
default, using P.UI Select with localized labels, themed menus and keyboard order
matching the visible controls. Navigation does not commit a selected date or
dismiss the picker. Caller `components` overrides remain available on Calendar.
Use `captionLayout="label"` on Calendar (or through a picker's `calendarProps`)
for the former text caption. Configure year ranges and order explicitly:

```tsx
import { DatePicker } from '@plain/ui';

<DatePicker
  aria-label="Birth date"
  calendarProps={{
    captionLayout: 'dropdown',
    startMonth: new Date(1900, 0),
    endMonth: new Date(2026, 11),
    reverseYears: true,
  }}
/>;
```

`dropdown-months` and `dropdown-years` show just one selector. The default year
window covers 100 years before and after today and includes explicitly displayed
outlying years. A one-sided bound anchors the opposite default window to that
bound. Range and date/time pickers use min/max months for navigation unless
`calendarProps.startMonth/endMonth` override them; selection restrictions still
apply. `month`, `defaultMonth` and `onMonthChange` control navigation independently
of the chosen date.
The `calendar.month-width` and `calendar.year-width` tokens set minimum selector
widths. Controls grow to fit complete labels and custom formatters instead of
showing ellipses. The header and day grid share a width; constrained headers wrap
the controls. Mobile date-time sheets separate date and time into two steps.

`DateRangePicker` starts a new range on the first date click, including when
editing an existing interval. The second click completes the inclusive range.
Desktop popovers stay open after either selection; Done, Escape or clicking
outside dismisses them. Desktop values update as dates are selected; mobile
sheets keep changes pending until Done. Selecting the
same date twice permits a one-day interval unless `minNights` excludes it.
Disabled dates and range limits still apply. Use the clear button or
Delete/Backspace on the trigger to clear a range.

Calendar popups keep their full content visible when it fits in the viewport.
If neither side of the trigger has enough room, the popup can overlap its trigger
to fit; content scrolls only when the available viewport really is too short.
Explicit collision boundaries, horizontal placement and custom maximum heights
retain the native Popover sizing behavior.

## Gantt timelines

`GanttChart` is available from `@plain/ui/charts`, with `@plain/ui/charts.css`.
It provides grouped month/day headers, day/week/month zoom, weekend shading,
Today navigation, progress, dependency arrows and task details. Dates remain ISO
date-only strings with exclusive ends. Application state owns changes and any
dependent-task scheduling rules.

```tsx
import * as React from 'react';
import { GanttChart, type GanttTask } from '@plain/ui/charts';
import '@plain/ui/styles.css';
import '@plain/ui/charts.css';

export function ProjectTimeline({ initialTasks }: { initialTasks: GanttTask[] }) {
  const [tasks, setTasks] = React.useState(initialTasks);
  return (
    <GanttChart
      label="Project delivery"
      tasks={tasks}
      defaultScale="day"
      showTaskList={false}
      onTaskChange={(next) =>
        setTasks((values) => values.map((task) => (task.id === next.id ? next : task)))
      }
    />
  );
}
```

Pointer moves and edge resizes commit once on release; Escape cancels. Keyboard
Alt+Arrow moves a task, Alt+Shift+Arrow changes its end, and arrow keys on a resize
handle adjust that edge. Direction follows RTL. Small bars retain a 24px hit target
without changing their drawn duration. Resize grips appear for bars at least 72px
wide; use keyboard editing or zoom for smaller bars. `draggable`, `resizable` and
`snapDays` configure pointer editing. Supply `scale` with `onScaleChange` for a
controlled view, or `defaultScale` for the built-in view selector.
When `dayWidth` is omitted, short timelines expand to fill the chart viewport.
An explicit `dayWidth` retains fixed date sizing.

Use `showToolbar`, `showTaskList`, `labelPosition`, `highlightWeekends`,
`weekendDays`, `showToday`, `showTodayButton`, `toolbarActions` and
`renderTaskDetails` to adapt the composition. Supply `today` for a business date
or deterministic SSR. Today navigation is unavailable when the date is outside
the current bounds. Set `showTaskDetails={false}` when your application owns details.
Typed slots and `gantt.weekend`, `gantt.bar-background`, `gantt.today` and
`gantt.dependency` theme aliases retain the P.UI styling contract.

Rows and date ticks are virtualized. The default complete table alternative is
memoized during scrolling; `dataTable="visible"` displays it. For very large sets,
provide a paginated accessible alternative and use `dataTable={false}`. Styled
defaults now use 48px rows, a grouped 72px header and three days around implicit
date bounds. `rowHeight={44}` and `rangePadding={0}` retain the previous density
and range; explicit start/end values are unchanged.

## Edge handles

ResizableHandle now defaults to a clean edge line, matching SidebarRail. Both
highlight with the same fade and growth transition on hover or keyboard focus;
the resize highlight stays visible during a drag. Their geometry and pointer hit
targets remain fixed. Devices without hover retain a visible affordance, and
system/provider reduced motion removes the optional transition.

Use `<ResizableHandle withHandle />` to retain the former grip pill, or supply
children for a custom grip. The `withHandle` default changed from true to false;
existing explicit choices retain their meaning. Native refs, separator keyboard
controls, consumer handlers and the sidebar's collapse action remain supported.

Theme aliases `edge-handle.color`, `edge-handle.thickness`, `edge-handle.duration`
and `edge-handle.ease` customize the shared treatment using P.UI's semantic tokens.

SidebarContent and NavigationRail lists scroll vertically. Group labels and menu
items stay within the available width, and collapsed items release space reserved
for hidden badges/actions. Compact icon padding adapts to narrower rails. Headers
and footers remain available while long menus scroll; desktop collapse retains
mounted content and input state.

## Section tabs

Use the underline presentation for a record's sections, with a full-width baseline
and tabs sized to their labels:

```tsx
<Tabs defaultValue="details">
  <TabsList
    aria-label="Record sections"
    variant="underline"
    fullWidth
    scrollable
    indicatorThickness={1}
  >
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="accounting">Accounting</TabsTrigger>
    <TabsTrigger value="inventory">Inventory</TabsTrigger>
  </TabsList>
  <TabsContent value="details">Record details</TabsContent>
  <TabsContent value="accounting">Accounting settings</TabsContent>
  <TabsContent value="inventory">Inventory settings</TabsContent>
</Tabs>
```

Import these parts from `@plain/ui` or `@plain/ui/navigation`. TabsList also accepts
`size="sm" | "md" | "lg"` and `animated={false}`. Existing defaults remain segmented,
intrinsic width and medium size. `scrollable` contains overflow and reveals active
tabs, including controlled selection, without moving the surrounding page. Bound
the parent width, or the list height for a vertical layout. It preserves native
refs, tab keyboard behavior, disabled items, RTL and reduced motion.

Scrollable tabs show a native draggable scrollbar whenever content overflows.
Its default track is 12px with a contrasting thumb, and it works with pointer
dragging, horizontal trackpad input and Shift-wheel. Keyboard focus keeps its
visible inset outline. The active underline is a thin painted bar, without a
full-height inset shadow or side lines, including when animation is disabled.

Theme aliases `tabs.border`, `tabs.indicator-color` and `tabs.indicator-thickness`
customize the baseline and underline. `tabs.scrollbar-size`, `tabs.scrollbar-thumb`
and `tabs.scrollbar-track` customize the native scrollbar; browsers and platform
settings govern native scrollbar rendering. Styling slots and `unstyled` remain
available.

## Empty states

Use any number of actions, custom media and supporting content with the shorthand:

```tsx
<EmptyState
  title="No projects yet"
  description="Start fresh, or bring your existing work."
  actions={
    <>
      <Button onClick={createProject}>Create project</Button>
      <Button variant="secondary" onClick={importProjects}>
        Import projects
      </Button>
      <Button variant="outline" asChild>
        <a href="/help">Documentation</a>
      </Button>
    </>
  }
  footer="You can invite your team later."
/>
```

Import the parts from `@plain/ui` or `@plain/ui/primitives`. The callbacks above
belong to your application. `actions` accepts arbitrary React content and takes
precedence over the compatible `action` prop. `media` replaces the default icon;
`icon={null}` or `media={null}` hides it. `variant` supports `default`, `muted` and
`outlined`; `size` supports `sm`, `md` and `lg`.

For complete control, supply children using `EmptyStateMedia`, `EmptyStateContent`,
`EmptyStateTitle`, `EmptyStateDescription`, `EmptyStateActions` and `EmptyStateFooter`.
Children replace the shorthand layout. Content accepts forms, lists and arbitrary
markup. Actions wrap by default; `layout="column"` stacks them and `align` controls
logical alignment. Media's `variant="icon"` adds a neutral container; `shape` accepts
`rounded`, `circle` and `square`. Plain media has no fixed dimensions.

Title defaults to `h3`; use `asChild` with your own heading when appropriate.
Description defaults to `p`; use `asChild` with a `div` for rich block content.
Every part forwards native props and refs and supports styling slots and `unstyled`.
Use the same semantic tokens as the rest of P.UI when customizing these parts.

## Scroll areas

ScrollArea widens its scrollbar on hover without changing viewport geometry.
`scrollbarSize`, `scrollbarHoverSize` and `scrollbarExpandOnHover` configure it.
Sizes describe the visible rounded pill (6px idle and 12px hovered by default).
The track adds a 4px gutter and retains a minimum 12px hit area. Only its painted
thickness animates, so the drag target and viewport stay fixed and both end caps
remain rounded. Vertical thumbs expand inward in LTR and RTL.
Faded edges are opt-in and use transparency, so they work on custom backgrounds:

```tsx
<ScrollArea
  aria-label="Projects"
  elastic
  style={{ height: 240 }}
  scrollbarSize={6}
  scrollbarHoverSize={14}
  fadeEdges={{ edges: ['top', 'bottom'], size: 32, intensity: 0.8 }}
>
  {projects}
</ScrollArea>
```

The example's `projects` is application content; import `ScrollArea` from `@plain/ui`.
`fadeEdges={true}` follows the scrolling axes. The default `mode: 'scroll'` fades
only edges with more content; `'always'` keeps configured edges faded. `start`/`end`
follow RTL. Keyboard-visible focus and forced colors remove edge fades for readability.
Theme aliases are `scrollbar.width`, `scrollbar.hover-width`, `scroll-area.fade-size`
and `scroll-area.fade-intensity`. Direct `ScrollBar` accepts `size`, `hoverSize` and
`expandOnHover`.

`elastic` opts into spring-like resistance at the enabled scroll edges for desktop
mouse wheels and trackpads. It activates at viewport widths of 768px and above
with a fine primary pointer and hover support. It stays inactive on mobile,
touch gestures and reduced/none motion, and resets when the device or motion
preference changes. Native scrolling, keyboard navigation, scrollbar dragging,
scroll dimensions, nested scrollers and pinch/zoom gestures are preserved. Pixel,
line and page wheel units and Shift-wheel horizontal scrolling are supported.
The visual pull uses progressive resistance, stays within 20px (less in small
viewports), and returns without a rebound. Large wheel impulses and trackpad
momentum tails share the same limit.

The existing `elastic` boolean now controls desktop feedback instead of its former
touch-only resistance. `onRefresh` independently enables touch pull-to-refresh and
its accessible refresh command; wheel/trackpad elasticity never triggers refresh.
Touch refresh uses a separate visual pull capped at 40px and a 28px loading hold,
scaled down for short scroll areas. `refreshThreshold` still controls the gesture
needed to activate refresh independently of that visual feedback.

## Develop

Install from the monorepo root with `npm ci`. Run
`npm run build --workspace=@plain/ui` or `npm run test --workspace=@plain/ui`.
Changesets version this package independently; the root and docs app are private.
Version 0.2.0 remains a local candidate, not a claim of npm publication.

MIT. See `LICENSE` and `CHANGELOG.md` in this package.
