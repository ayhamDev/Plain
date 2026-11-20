# Connected Sheet and Drawer overdrag backgrounds

Integrated after `024d9f3`, with a pending patch Changeset for `@plain/ui`.
The manifest remains the local 0.2.0 candidate; no npm publication is implied.

Attached viewport Sheets and Drawers continue their computed background past the
attachment edge during elastic dragging. The shared fix supports all four physical
edges, bounded widths, RTL, local theme tokens, inline backgrounds and reduced
motion. Detached and floating panels retain their intentional gaps. Unstyled and
custom-container panels retain their own presentation.

Vaul's original background pseudo-element was clipped by the dialog's scrollport
and could add empty scroll space. A decorative sibling now follows the native
transform without changing the dialog element, content layout, hit area, refs,
native events or snap dimensions. Transform-only movements do not trigger React
updates or additional layout measurements. Geometry and appearance refresh on
resize, theme or style changes; observers are cleaned up with the panel.
The extension exposes the shared `sheet.overflow-fill` styling slot.

Validation:

- TypeScript, ESLint/workspace boundaries, formatting, and the library/docs build
  passed. The final movement overlap and pixel-check refinements also passed
  focused ESLint and formatting checks.
- The full suite passed: 9 workspace checks, 219 library tests and 6 documentation
  tests. Native Sheet/Drawer interaction and ref contracts are included.
- Package validation passed: 221 files in the 479,860-byte archive, 103 compiled
  examples, exported CSS/subpaths, and SSR with React 18.3.1 and 19.3.0. The
  Button-only bundle remains 20,020 bytes gzip within its 25kB budget, with heavy
  features excluded. The downloadable archive was refreshed.
- All 16 focused Playwright cases passed in Chrome 157.0.8103.79. Real mouse
  gestures cover both components on all four edges; a CDP touch gesture covers
  a mobile drawer. Pixel samples exactly match the exposed area to the interior
  surface. The join allows at most one channel level of fractional GPU rounding.
  Cases also cover bounded/custom backgrounds, theme changes, reduced motion,
  native scroll events and refs, long content, slider controls, snap cycling,
  focus restoration, cleanup, and the absence of phantom scroll space. The
  movement performance check confirms transform-only updates do not remeasure.
- Three existing assembled-docs regressions passed: touch/keyboard snap points,
  local RTL theme portals, and mobile filtering with native Select controls.
- Six production-page scenarios passed at 1440px light/LTR, 320px light/LTR and
  390px dark/RTL. Drawer handle dragging and Sheet content swiping expose about
  25px of continuation; the surface matches throughout. Dismissal and focus
  restoration passed, without page errors, document overflow or detected Axe
  WCAG A/AA violations in the tested states. Screenshots were inspected.

Local evidence is in the ignored `.preview/panel-overflow-qa/` directory. Command
logs use `.preview/panel-overflow-*.log`; fixture captures are under
`apps/docs/test-results/`. Coverage is scoped to this change. Other browser engines,
physical devices, actual browser zoom and screen-reader sessions were not tested.
