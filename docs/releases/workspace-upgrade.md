# P.UI Workspace Upgrade

**Status:** Verified local integration; pending Changeset release.
**Package:** `@plain/ui`, working version 0.2.0. **Date:** 2026-10-02.
**Candidate:** The `codex/next` commit introducing this record, based on the clean
`cc1606f` checkpoint. Resolve it with
`git log --diff-filter=A -1 -- docs/releases/workspace-upgrade.md`.
The previous versioned-documentation and scheduling phases were committed before
this phase began. No package version, publication or deployment is assigned here.

## Consumer Changes

- Add nested `LanguageProvider` / `TranslationProvider`, English and Arabic
  dictionaries, typed string/function overrides, direction context and bounded
  locale-formatting caches. Application content remains application-owned.
- Add `Chips`, docked/modal/fullscreen `SearchView`, optional `KanbanBoard`,
  virtualized `GanttChart`, `HeatmapChart`, and Pie, Radar, Scatter and Composed
  chart wrappers. Heavy features remain outside the core barrel.
- Extend DataTable with typed text, number, date, boolean, enum and custom
  filtering; simple column chips and advanced AND/OR rules; dedicated selection
  controls; and abortable remote pagination, sorting and dynamic filter fields.
  Transport, authorization and server query execution remain application-owned.
- Use the shared Table primitives for chart data alternatives. Sticky headers,
  footers and synchronized horizontal scrollbars support internal, page and outer
  scrolling without cloning interactive headers.
- Normalize input borders, add outlined/filled/ghost field variants, fix empty
  states and collapsed sidebar slots, expand tree nodes from the full row, and
  improve bottom navigation, Sheet configurations and overlay/step motion.
- Default ScrollArea to floating hover scrollbars without a reserved gutter.
  Add optional touch elasticity and async pull-to-refresh with keyboard access.
  Native browser scrollbars inherit P.UI tokens where the browser supports them.
- Promote Resizable panel APIs, compact hidden/docked/floating layouts and
  persistence. Keep the existing SplitPane exports as compatibility aliases.
- Cache calendar event indexes, formatting and slot labels. Use primary tokens
  for event cards and an isolated printable surface with custom content slots.
  Export `CalendarEventDialog` as an optional composable editor; FullCalendar does
  not own event creation, validation or persistence.
- Add public API tables, live examples, localization/table guides and responsive
  previews. Preserve the independently built 0.1 documentation archive.

Chesai was inspected for behavior and configuration ideas only. Its visual styles
and color tokens were not adopted. P.UI's original neutral defaults remain intact;
generated brand palettes are still opt-in. The earlier generated blocks/templates
remain empty and are not package exports.

## Migration

Use `Resizable`, `ResizablePanel` and `ResizableHandle` for new code. Old SplitPane
exports and `split-pane.*` styling overrides remain aliases, with canonical
`resizable.*` overrides taking precedence. Panel DOM `data-ui` identifiers now use
`resizable`; update consumers that intentionally query these implementation tags.
Keep editor state above panels when compact mode remounts their surfaces.

Import charts from `@plain/ui/charts` with `@plain/ui/charts.css`, calendar/editor
from `@plain/ui/full-calendar` with `@plain/ui/full-calendar.css`, and Kanban from
`@plain/ui/kanban`. Localization, Chips and SearchView also have dedicated
`/i18n`, `/chips` and `/search-view` entry points. Core styles cover these controls.
Set document `lang` and `dir` at the application boundary. Calendar values remain
local wall-time strings; applications must choose their instant/timezone policy.

The minor Changeset in
[localized-workspace-components.md](../../.changeset/localized-workspace-components.md)
records consumer-visible changes and remains unconsumed. Existing pending
Changesets are preserved. No version bump was performed.

## Validation

Windows, Node **24.13.0**, npm **11.6.2**, React **19.3.0**, TypeScript **6.0.0**,
Chrome **154.0.8037.95**. Browser tests used `http://127.0.0.1:5175`.
Primary visual profiles were 1440px light LTR, 390px dark RTL and 320px light LTR;
additional checks used 768px and 1280px. Coverage includes neutral and explicit
brand palettes, scoped portals, keyboard interaction and system/reduced/none
motion policies.

| Check                                        | Result                                                            |
| -------------------------------------------- | ----------------------------------------------------------------- |
| TypeScript, ESLint, Prettier, Git whitespace | Passed                                                            |
| Final unit run                               | **176/176 passed**, 10 files                                      |
| Library and documentation builds             | Passed; two independently built documentation versions            |
| Installed package verification               | Passed; 101 examples compile, React 18/19 SSR and exports checked |
| Changesets status                            | Minor release pending, not applied                                |
| Full browser matrix                          | **415 passed, 7 failed**, 422 total, no skipped cases             |
| Focused recovery                             | **33 passed, 1 failed**, 34 total                                 |
| Final Resizable recovery                     | **6/6 passed**, two profiles repeated three times                 |
| Distinct scenarios across those browser runs | **426/426 have a successful result**                              |

The full browser command exited nonzero. Five failures were overloaded automated
accessibility scans that timed out; each passed in the single-worker recovery.
One exposed insufficient contrast on calendar event times, fixed by inheriting the
event foreground. One used obsolete drawer-close steps after property controls
became inline; its final desktop/mobile repetitions passed after correcting the
test. The focused recovery added four contrast scenarios for all calendar views,
rest/hover states, light/dark and LTR/RTL.

The 426 aggregate is a union of distinct scenario identities, not a claim that a
single 426-case command passed. The complete matrix was not rerun after the final
narrow CSS/test fixes. No known failing scenario remains; raw run history is
preserved in ignored local evidence rather than rewritten as a green full run.

### Workflow Evidence

- Final package verification rebuilt the 412,174-byte archive containing 181
  files and compiled 101 public examples. React 18.3.1 and 19.3.0 SSR passed.
  A button-only installed consumer measured 20,558 gzip bytes, with heavy chart,
  scheduling, Kanban and motion features excluded. There are no generated
  block/template compositions in the package.
- All calendar views with 1,000 events stayed below their 2,000ms interaction
  budget. Final focused measurements: Week 1,182ms, Day 749ms, Agenda 890ms,
  Month 979ms. These are local test measurements, not a cross-device guarantee.
- A 2,000-task Gantt kept fewer than 30 mounted task rows, with later records
  still interactive. Kanban exercised actual cross-lane pointer dragging,
  keyboard reordering and explicit move commands.
- Sticky table checks covered internal/page/outer scrolling, offsets, focusable
  original headers, synchronized horizontal scroll and LTR/RTL. Remote tests
  exercised filtering, sorting, pagination, cancellation and loading/error states.
- Visual review covered 70 captures, including open custom pickers and a collapsed
  sidebar. Checks caught and fixed zero-width bottom-navigation icons, cramped
  narrow Gantt labels and a dark application background leaking onto print paper.
- Chromium print-media and PDF checks verified an isolated white page, primary
  event/table tokens, six event rows, custom header/footer and RTL. This does not
  establish physical-printer output or native print-dialog behavior.
- Automated accessibility scans, keyboard/focus checks, touch-sized geometry,
  responsive layouts and motion policies passed in the successful scenario runs.
  They do not establish complete WCAG conformance.

### Reproduction

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npm.cmd test
npm.cmd run build:docs
$env:npm_config_offline = 'true'
npm.cmd run verify:package
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:5175'
$env:PLAYWRIGHT_JSON_OUTPUT_NAME = '.preview/workspace-final-browser.json'
npm.cmd exec -- playwright test --workers=2 --output=.preview/workspace-final-test-results --reporter=list,json
$env:PLAYWRIGHT_JSON_OUTPUT_NAME = '.preview/workspace-recovery-browser.json'
npm.cmd exec -- playwright test --workers=1 --grep 'calendar|scheduler|split panels resize|box docs preview|light violet palette|dark neutral palette|detached and floating' --output=.preview/workspace-recovery-test-results --reporter=list,json
$env:PLAYWRIGHT_JSON_OUTPUT_NAME = '.preview/workspace-resizable-final-browser.json'
npm.cmd exec -- playwright test tests/e2e/layout-controls.spec.ts --workers=1 --grep 'split panels resize' --repeat-each=3 --output=.preview/workspace-resizable-final-test-results --reporter=list,json
```

Run browser commands sequentially with distinct output directories and no source
edits/build generators during a run. The JSON reports above,
`.preview/workspace-final-units.json`, `.preview/workspace-visuals/`,
`.preview/workspace-calendar-print.png` and `.preview/workspace-calendar-print.pdf`
are local ignored evidence, not published release assets.

## Limits And Distribution

Physical mobile devices, real screen readers, Firefox/Safari, a physical printer
and remote CI were not verified. Virtualized views still require an application
search/nonvirtual alternative for content discovery. Remote tables, search,
Kanban, calendar editing and task changes require application persistence and
server validation. Elastic pull gestures are opt-in and depend on device/browser
touch behavior. Custom themes and renderers need their own contrast and keyboard
checks.

This is local integration evidence, not registry publication or website
deployment. The rebuilt `public/plain-ui-0.2.0.tgz` is a local candidate download,
not a new released version. The original archive and release history remain
separate from this working checkout.
