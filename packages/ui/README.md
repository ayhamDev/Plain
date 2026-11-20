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
- `/layout`, `/sidebar`, `/virtual`, `/advanced`, `/date-time`, `/typography`,
  `/i18n`, `/chips`, `/list`, `/search-view`, `/data-table`, `/forms`, `/overlays`, `/theme`
  and other declared exports provide modular entry points.

Heavy chart, scheduling, Kanban and motion implementations stay outside the core
barrel. Calendar editing, server filtering and persistence remain application
responsibilities. Custom themes/renderers require application accessibility QA.

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

Sheet/Drawer now default to `handleOnly={true}` so nested controls keep their
gestures. Vertical panels include a handle automatically; opt into content swipes
with `handleOnly={false}`. Use `maxWidth` with detached or floating bottom sheets
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
default, with localized labels and keyboard order matching the visible controls.
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
The `calendar.month-width` and `calendar.year-width` tokens keep selector widths
stable between month names and can accommodate custom labels or formatters.

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
Sizes include the track's 4px gutter; the minimum hit area remains 12px.
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
follow RTL. Keyboard-visible focus and forced colors remove masks for readability.
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

The existing `elastic` boolean now controls desktop feedback instead of its former
touch-only resistance. `onRefresh` independently enables touch pull-to-refresh and
its accessible refresh command; wheel/trackpad elasticity never triggers refresh.

## Develop

Install from the monorepo root with `npm ci`. Run
`npm run build --workspace=@plain/ui` or `npm run test --workspace=@plain/ui`.
Changesets version this package independently; the root and docs app are private.
Version 0.2.0 remains a local candidate, not a claim of npm publication.

MIT. See `LICENSE` and `CHANGELOG.md` in this package.
