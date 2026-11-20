# Desktop ScrollArea elasticity

Integrated after `d2cc796`, with a pending minor Changeset for `@plain/ui`.
The manifest remains the local 0.2.0 candidate; no npm publication is implied.

`<ScrollArea elastic />` opts into bounded edge resistance with a critically
damped return for mouse wheels and trackpads. Native scrolling retains ownership
of scroll positions, keyboard navigation, thumb dragging and native events.
Both axes, RTL, Shift-wheel and pixel/line/page deltas are supported. Canceled
consumer events, nested scroll owners, form controls and zoom gestures are left
to their owners. Feedback does not trigger refresh.

Desktop eligibility requires a viewport of at least 768px, hover support and a
fine primary pointer. Coarse-pointer devices, narrow layouts, touch input and
reduced/none motion do not activate this effect. Changes to the desktop query or
motion policy clear active offsets. Keyboard/focus changes and prop opt-out also
clear them. This replaces the boolean's former touch-only resistance;
`onRefresh` independently retains explicit touch pull-to-refresh and its
keyboard-accessible command.

Only the content moves. A clipped content wrapper keeps transforms out of native
scroll dimensions, and each viewport resets its own private offsets so nested
areas cannot inherit a second translation. Per-frame work uses DOM properties
without React state updates. Documentation and the copyable preview expose the
existing opt-in boolean.

Validation:

- TypeScript, ESLint/workspace boundaries, formatting and the library/docs build
  passed. The final nested-area CSS and browser assertions also passed focused
  formatting and ESLint checks.
- All 234 tests passed: 9 workspace checks, 219 library tests and 6 documentation
  tests. Updated ScrollArea checks retain native viewport/root refs, wheel and
  scroll callbacks, logical fades and caller styles. Pull cancellation and the
  accessible refresh command remain covered.
- All 28 focused Chrome 157.0.8103.79 browser cases passed: 17 elasticity cases and
  11 existing fade/scrollbar regressions. Coverage includes all four edges in
  LTR/RTL, smooth intermediate return frames, bounded offsets, unchanged native
  dimensions and positions, small pixel sequences with decreasing momentum,
  immediate reversal, wheel delta units, keyboard/focus, nested areas and textarea
  scrolling, caller cancellation, zoom, short content, opt-out, resize and reduced
  motion. Phone widths 320/390 and a 1000px coarse-pointer context retained zero
  elastic translation during wheel and CDP touch input. Explicit mobile refresh
  and its keyboard command still worked. The tested focus state had no detected
  Axe WCAG A/AA violations.
- Package validation passed: 225 files in the 485,219-byte archive, 103 compiled
  public examples, exported CSS/subpaths and SSR with React 18.3.1 and 19.3.0.
  The Button-only bundle remains 20,020 bytes gzip with heavy features excluded.
  The downloadable archive was refreshed.
- Four built-page scenarios passed: 1440px light/LTR and 1000px dark/RTL exercised
  top/bottom wheel feedback and return, with 40px peak offsets at the configured
  160px viewport height. At 320px light/LTR and 390px dark/RTL, requesting the effect
  still left it inactive. Native dimensions, positions, focus and document width
  remained stable; there were no page errors or detected Axe WCAG A/AA violations
  in the tested states. Screenshots were inspected.

Local evidence is in the ignored `.preview/desktop-elastic-qa/` directory,
including `production.json`. Logs use `.preview/desktop-elastic-*.log`, and
fixture screenshots are under `apps/docs/test-results/`. Wheel/trackpad-style
sequences and touch gestures were injected in Chrome; physical mouse/trackpad
hardware, other browser engines, actual browser zoom and screen-reader sessions
were not tested.
