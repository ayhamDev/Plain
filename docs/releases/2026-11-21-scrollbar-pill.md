# Complete rounded ScrollArea thumbs

Integrated after `8922827`, with a pending patch Changeset for `@plain/ui`.
The local package remains 0.2.0. Validation date: 2026-11-21.
No npm publication or deployment is implied.

ScrollArea previously narrowed a rounded background with content-box padding.
That cut into its rounded caps. Track padding also reduced the visible default
widths from the configured 6px/12px to 2px/8px. The thumb now uses a rounded paint
mask, animating its visible thickness while keeping the native thumb, rail and
viewport geometry stable. Transparent paint still accepts native thumb dragging.

Configured sizes describe the visible pill. The rail adds a fixed 4px gutter,
with a minimum 12px track target; its 2px padding remains fixed when the root
font grows. Vertical paint stays anchored to the outside edge in LTR and RTL;
horizontal paint stays anchored to the bottom. Existing semantic colors, custom
backgrounds, size overrides, hover opt-out, styling slots, unstyled composition
and motion policies remain available. No wrapper, dependency, export or public
prop was added. Documentation describes the corrected sizing behavior.

Validation:

- All 361 tests passed: 9 infrastructure, 346 library and 6 docs tests. The full
  run used `--concurrency=1 -- --testTimeout=15000 --maxWorkers=1`; repository
  timeout settings were not changed.
- Workspace TypeScript, ESLint, dependency boundaries, formatting, Changesets
  status, library/docs builds and package-content checks passed. Installed-package
  verification compiled 106 examples and checked React 18.3.1/19.3.0 server
  rendering. The updated archive contains 257 files and is 570,508 bytes.
  Button/layout gzip sizes remain 17,445/15,787 bytes.
- Chrome 157.0.8103.79 passed all 34 ScrollArea browser scenarios in the final
  single-worker run. They cover intermediate animated widths, actual painted
  pixels and rounded caps on both axes, LTR/RTL, enlarged root fonts, custom
  colors/sizes, fixed transparent hit targets, dragging, forced colors, reduced
  motion, edge fades, resize, keyboard scrolling, wheel and trackpad-like deltas,
  nested scroll ownership, mobile native behavior and accessibility. An initial
  parallel nested-wheel probe missed its transient elastic threshold; the
  unchanged scenario passed in isolation and in the final complete run.
- The production docs example passed at 1440x1000 light/LTR/system motion,
  720x1000 dark/LTR/no motion, 320x1000 light/LTR/system motion and 1000x800
  dark/RTL/reduced motion. Checks covered 6px idle and 12px hover paint, hover
  leave, stable geometry, native thumb dragging, Home, wheel scrolling, horizontal
  document overflow, page errors and scoped Axe WCAG A/AA checks. Screenshots
  were visually inspected, including the narrow and dark RTL examples.

Evidence is in `.preview/scrollbar-pill-*` logs, the
`.preview/scrollbar-pill-verified-report` browser report and
`.preview/scrollbar-pill-qa/production.json` with production screenshots.
Touch uses Chrome emulation; physical devices, Safari, screen readers and remote
CI were not verified here.
