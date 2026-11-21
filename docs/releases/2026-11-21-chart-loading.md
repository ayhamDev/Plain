# Chart loading skeletons

Validated after `0ae2887` on 2026-11-21 with a pending minor Changeset for
`@plain/ui`. The package remains 0.2.0; this record does not imply publication
or deployment.

Area, Bar, Line, Composed, Donut, Pie, Radar, Scatter, Heatmap and Gantt use
neutral skeletons shaped like their visualization while loading. Fixed chart
viewports retain their height. Heatmap placeholders follow the known grid;
Gantt placeholders respect its viewport, toolbar and task-list settings.
Loading hides stale data tables and Heatmap legends. Empty states remain
separate, and localized loading announcements remain available to screen readers.

`ChartSkeleton` is exported from the core and charts entry points for lazy-loading
fallbacks. It supports native props/refs, dimensions, variants, optional features,
Heatmap grid density, styling slots, unstyled composition and skeleton theme
tokens. Its pulse uses the shared CSS animation and becomes static under
reduced/none motion, system reduced motion or `animate={false}`. The placeholder
does not run a chart engine, resize observer, timer or per-frame JavaScript.
`Chart.loadingVariant` supports custom compositions. Chart documentation uses
the same skeletons while downloading the lazy chart module.

Validation:

- All 403 repository tests passed: 9 infrastructure, 388 library and 6 docs tests.
  The 16 new chart-loading tests cover all ten families, stale-data suppression,
  transitions, native props/refs, localization, motion, unstyled slots and SSR.
  These 16 tests also passed after the final Heatmap density/alignment refinement.
- TypeScript, ESLint, workspace boundaries, formatting, library/docs builds,
  Changesets status, diff checks and package dry-run passed.
- The installed package compiled 106 documented examples plus the consumer
  fixture. Both exports and static accessible skeleton SSR passed with React
  18.3.1 and 19.3.0. The refreshed docs archive contains 283 files and is
  617,454 bytes. Existing eager Button/Layout gzip measurements remain
  19,512/17,776 bytes, below their unchanged 25 kB budgets. A separate installed
  consumer importing only ChartSkeleton retained no Recharts/D3, scheduling,
  Motion or virtualization engine.
- Six new Chrome scenarios passed against compiled package/docs code: all ten
  skeleton variants at 1440px light/LTR, 390px dark/LTR and 320px dark/RTL;
  stable plot height and loading-to-ready-to-empty transitions; keyboard tooltips;
  live system reduced-motion changes, explicit reduced/none policy, scoped
  skeleton tokens; and an intentionally delayed chart-module download.
  The three viewport/theme matrices reported no Axe violations or page errors,
  and no horizontal document overflow. Decorative SVGs stay hidden from assistive
  technology and loading text is visually hidden.
- Two existing Chrome scenarios also passed: native chart plots, semantic colors,
  data alternatives and keyboard tooltips across Area/Bar/Line/Donut; and a dark
  RTL chart with motion explicitly disabled. Desktop and narrow/mobile loading
  screenshots were visually inspected. Private screenshots and logs are under
  `.preview/chart-screenshots` and `.preview/chart-*.log`.

Browser checks use Chromium emulation. Physical-device and screen-reader testing,
other browser engines, and remote CI were not performed in this local run.
