# Gantt timeline refinement

Integrated after `108fbf0`, with a pending minor Changeset for `@plain/ui`.
The package manifest remains the local 0.2.0 candidate; no npm publication is
implied. Behavioral inspiration came from the supplied screenshots and
[Frappe Gantt's configuration](https://docs.frappe.io/gantt/config). The chart
retains P.UI tokens and the existing Temporal/TanStack engines; no Frappe code,
stylesheet or runtime dependency was added.

## Behavior and configuration

The chart has grouped month/year and date headers, configurable weekend shading,
a Today marker/navigation, controlled or uncontrolled day/week/month views,
optional task labels, progress, task detail popovers and rounded dependency
arrows. Short timelines fill the available width unless `dayWidth` is supplied.
The toolbar, task column, details, marker, weekend days, bar geometry and render
slots are configurable. Typed theme aliases cover weekends, bar backgrounds,
today and dependencies; defaults use the existing neutral palette.

With `onTaskChange`, pointer movement and either resize edge preview snapped days
and commit once on release. Escape, pointer cancellation and capture loss cancel;
other pointers cannot finish the active gesture. Native task data remains owned
by the application. Existing keyboard movement and end resizing remain available,
and resize handles also accept directional arrows. Direction follows RTL.

Styled defaults now use 48px rows, a 72px grouped header and three days around
implicitly derived range edges. Explicit range edges and exclusive task ends are
preserved. `rowHeight={44}`, `rangePadding={0}`, `showToolbar={false}` and
`showTaskDetails={false}` retain the corresponding former choices. Disable the
built-in details when the application owns a task dialog. Resize grips appear
on bars at least 72px wide; smaller bars retain keyboard editing and can be
widened with `dayWidth` or a closer view. Hit targets expand without changing
the drawn dates.

Rows/date ticks stay virtualized, measurement keys are stable, and pointer preview
updates are day-snapped. The complete P.UI Table alternative is memoized so native
scrolling does not rebuild it. It includes dependency names and exclusive-end
labels. Supply an accessible paginated alternative with `dataTable={false}` for
very large sets. Dependency connectors describe relationships; application code
owns cascading schedule rules. Arrows join endpoints in the rendered row window.

## Verification

- ESLint/workspace boundaries, TypeScript, Prettier, production build and package
  verification passed. All 103 catalog examples and every playground configuration
  compiled. The downloadable documentation archive was regenerated.
- The full run passed 206 library, 6 documentation and 9 workspace tests. New date
  coverage exercises leap days, partial weeks, real month/year boundaries, range
  clipping, one-day resize limits, invalid numeric values and deterministic SSR.
  A React Profiler regression also verifies that visual-only updates leave data
  cells idle while changed dates refresh them. Stable style-provider input keeps
  context propagation from bypassing the table memoization.
- Chrome 157.0.8103.79 / Playwright passed 14 development scenarios, including
  pointer movement, both resize edges, one commit per gesture, Escape cancellation,
  disabled tasks, Today navigation, view changes, task details/focus return, Arabic,
  LTR/RTL, light/dark and 320px mobile bounds. Existing keyboard, compact label and
  large timeline regressions passed. The prior large-data regression now scrolls
  by measured row height rather than assuming the former density.
- A 2,000-task fixture with a 30-year daily range stayed below 30 rendered rows and
  50 date ticks before/after scrolling. Later tasks remained reachable and active.
  This is bounded-DOM evidence, not a claim about every dataset or device.
- Axe A/AA scans passed for the exercised fixture states. Two additional production
  preview cases passed at 1440px LTR/light and 390px RTL/dark; screenshots of the
  day, compact and overview states were visually inspected.
- The installed Gantt package rendered without warnings under React 18.3.1 and
  19.3.0. The general package verifier also passed peer SSR, public export/CSS checks
  and a Button-only consumer of 20,020 bytes gzip within the 25kB budget, with heavy
  engines excluded.
- Physical touch devices, screen readers, other browser engines and remote CI were
  not exercised. Application-owned renderers, colors and scheduling rules require
  their own integration checks.

The fixture is `apps/docs/tests/fixtures/gantt-refinement.*`; tests are in
`apps/docs/tests/e2e/gantt-refinement.spec.ts`. Screenshots are generated in ignored
Playwright output directories. Use development for fixture cases, and development
or production preview for the built-preview cases:

```sh
npm run test:e2e -- gantt-refinement.spec.ts --grep-invert "built Gantt preview"
npm run test:e2e -- gantt-refinement.spec.ts --grep "built Gantt preview"
```
