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

## Develop

Install from the monorepo root with `npm ci`. Run
`npm run build --workspace=@plain/ui` or `npm run test --workspace=@plain/ui`.
Changesets version this package independently; the root and docs app are private.
Version 0.2.0 remains a local candidate, not a claim of npm publication.

MIT. See `LICENSE` and `CHANGELOG.md` in this package.
