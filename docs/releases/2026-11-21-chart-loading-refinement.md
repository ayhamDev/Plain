# Chart loading refinement

Validated locally on 2026-11-21, based on `9f0d14d`. A minor Changeset records
the compatible standalone fallback options and the shared visual update. The
package remains 0.2.0; no registry publication or deployment was performed.

All ten loading families now use explicit SVG paint for every shape. The SVG
defaults to no fill, axes use separate straight paths, and filled areas have
explicit muted fills. Area and radar fills are lighter, pie slices have real
gaps, donut rings are slimmer, and scatter points and placeholder labels use
fixed-width strokes that stay consistent in stretched viewports. Heatmap and
Gantt placeholders share the same neutral treatment. Radial proportions remain
round. No chart engine, observer, timer or per-frame JavaScript was added.

Chart loading infers the visible grid, axes and legend from P.UI helpers or native
Recharts children, including hidden axes and grids with both directions disabled.
Standalone `ChartSkeleton` exposes `grid`, `xAxis` and `yAxis` flags; the lazy docs
fallback forwards the corresponding playground settings. Existing scoped tokens,
unstyled slots, native props/refs, loading announcements, reduced motion and
separate ready/empty states remain available.

The initial isolated audit of the running 5173 server did not reproduce the
attached black polygon appearance. This update removes remaining fill inheritance,
refines all families and broadens actual-page paint checks beyond the prior line
example rather than assuming a specific browser-cache cause.

Validation:

- Eighteen loading unit tests and 32 existing date/chart regression tests passed.
  New coverage verifies hidden axes/grids in helper and native compositions,
  standalone options and suppression of internal props on the DOM.
- All six docs tests passed, compiling playground defaults, enum choices,
  toggles and numeric boundaries as complete copyable TSX.
- Twelve headless Chrome browser scenarios passed against compiled code: ten
  loading scenarios and two existing native chart regressions. The loading
  scenarios include every family in the fixture and all ten actual component
  pages at 1440px light/LTR, 390px dark/LTR and 320px dark/RTL. Sixty actual-page
  captures cover styled output and output with styling classes removed. Checks
  validate every SVG shape's paint, not only guide/line paths. Axes/grid/legend
  toggles retain viewport dimensions. Axe scans, overflow checks, scoped tokens,
  live reduced motion, ready/empty transitions and delayed module loading pass.
  Existing chart checks cover visible data, palette colors, accessible tables,
  keyboard tooltips and explicit motion-none behavior. Desktop area, pie, scatter,
  radar and Gantt plus narrow dark/RTL captures were visually inspected.
- TypeScript, ESLint, workspace boundaries, formatting, library/docs builds,
  Changesets planning, diff checks and package dry-run inspection passed.
- Installed-package verification compiled 107 component examples and the consumer
  fixture, including the new fallback flags. React 18.3.1 and 19.3.0 SSR passed.
  The refreshed archive contains 295 files and is 634,991 bytes. Existing eager
  Button/Layout gzip remains 19,512/17,776 bytes and heavy-feature exclusions pass.

Private evidence is under `.preview/chart-refresh-*`. The full repository test
suite was not repeated; checks target the changed chart renderer and its docs.
Browser checks use local Chrome 157.0.8103.79. Physical devices, screen readers,
other browser engines and remote CI were not tested. The user's existing 5173
server was retained; compiled browser checks used a private 5222 preview.
