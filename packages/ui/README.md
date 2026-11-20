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

## Composable collections and feedback

`List` and `DataTable` support explicit `browse` and `selection` modes. Use
`selectable defaultMode="browse"` for a Select/Done workflow, or control `mode`
and selection from your application. Table search, filtering, sorting, column
controls, pagination and the entire toolbar can be hidden independently. On
small screens the filter and sort editors use a bottom sheet automatically.

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
for centered, bounded panels. Toasts now use the current surface and include a
close button; `invert` and `closeButton={false}` retain the previous appearance.

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

## Develop

Install from the monorepo root with `npm ci`. Run
`npm run build --workspace=@plain/ui` or `npm run test --workspace=@plain/ui`.
Changesets version this package independently; the root and docs app are private.
Version 0.2.0 remains a local candidate, not a claim of npm publication.

MIT. See `LICENSE` and `CHANGELOG.md` in this package.
