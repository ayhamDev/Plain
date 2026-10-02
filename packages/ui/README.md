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
  `/i18n`, `/chips`, `/search-view`, `/data-table`, `/forms`, `/overlays`, `/theme`
  and other declared exports provide modular entry points.

Heavy chart, scheduling, Kanban and motion implementations stay outside the core
barrel. Calendar editing, server filtering and persistence remain application
responsibilities. Custom themes/renderers require application accessibility QA.

## Develop

Install from the monorepo root with `npm ci`. Run
`npm run build --workspace=@plain/ui` or `npm run test --workspace=@plain/ui`.
Changesets version this package independently; the root and docs app are private.
Version 0.2.0 remains a local candidate, not a claim of npm publication.

MIT. See `LICENSE` and `CHANGELOG.md` in this package.
