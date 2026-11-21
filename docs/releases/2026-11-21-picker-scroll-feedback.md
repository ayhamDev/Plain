# Calendar pickers and scroll feedback

Integrated after `681983c`, with pending patch Changesets for `@plain/ui`.
The manifest remains the local 0.2.0 candidate; this work does not publish an npm
release. Local validation date: 2026-11-21.

Calendar month/year navigation now uses P.UI Select, including scoped tokens,
direction, localized labels, bounds, disabled options and keyboard operation.
The default year width is 72px so four-digit years remain readable in Inter.
Calendar component overrides remain available. Month/year navigation leaves the
date value unchanged and keeps the parent picker open. Explicit unstyled
composition removes the new Select defaults.

DateRangePicker uses DayPicker's reset-on-select range behavior. Editing starts
an incomplete range on the first click and closes only after a valid second
endpoint. Same-day and reversed ranges remain available; disabled days and range
limits still apply. Native form values, controlled values, clearing, reset and
focus return retain their contracts.

An internal picker popup adapter reduces the trigger gap only when the complete
picker fits the viewport but neither side of the trigger has enough room. This
can overlap the trigger instead of truncating the calendar/time controls. Radix
retains focus, dismissal, portals and collision handling. Truly oversized content
still scrolls. Explicit collision boundaries, horizontal placement and inline
maximum heights retain native positioning. Mobile time pickers keep their sheet
presentation.

ScrollArea's opt-in desktop elasticity now uses progressive resistance with a
maximum 20px displacement, reduced further for small viewports, and a quicker
critically damped return. Mouse-wheel impulses, page/line units and trackpad tails
share that limit. Mobile custom wheel elasticity remains inactive. Independently
enabled touch pull-to-refresh has at most 40px of visual pull and a maximum 28px
loading hold, scaled down for short scroll areas. Refresh activation distance
remains unchanged. Touch settling is 240ms and respects the existing motion
policy. No dependency or public API was added.

Validation:

- All 348 workspace tests passed: 9 workspace checks, 333 library tests and 6 docs
  tests, including compilation of complete preview configurations. Final focused
  picker, localization and theme checks passed all 43 cases after the last
  refinements, using a 15-second per-test timeout for the large year-menu DOM
  checks on this loaded workstation; repository timeout defaults are unchanged.
- TypeScript, ESLint, workspace boundaries, formatting, Changesets and production
  library/docs builds passed. The final installed-package check compiled 106
  examples and verified Calendar captions and range form values with React 18.3.1
  and 19.3.0. The archive contains 249 files and is 548,357 bytes. Button and layout
  gzip sizes remain 17,445 and 15,787 bytes respectively; heavy features remain
  excluded from those consumers.
- Chrome 157.0.8103.79 passed 54 distinct development scenarios across the
  combined and follow-up runs. Coverage includes mouse wheel and small trackpad
  deltas, large bursts, line/page units, reversal, native scroll dimensions,
  nested scrollers, canceled events, keyboard input, reduced motion, device
  changes, mobile opt-out and CDP pull-to-refresh. Picker checks include editing
  existing ranges, single-day/reversed intervals, month/year bounds, scoped
  Arabic menus, real Inter text widths, five/six-week transitions, focus return
  and constrained viewport placement. Applicable scoped Axe WCAG A/AA scans
  passed. The final 1000x600 focus case was repeated after a generated-asset reload
  interrupted one development run; it passed with a stable server.
- Production workflows passed at 1440x900 light/LTR, 1000x600 dark/RTL and
  320x760 light/LTR: Select navigation, range editing, date-time completion,
  focus, popup geometry, scoped Axe scans and page-error checks. A normal 120px
  wheel event in the 160px preview produced a measured peak of 9.495px at both
  desktop profiles; the mobile preview kept desktop elasticity inactive.
  Representative production menus, mobile sheets and desktop/RTL calendars were
  visually inspected after animations completed.

Evidence is under `.preview/picker-scroll-qa`, including production screenshots
and `production-results.json`. Combined development reports are in
`.preview/pickers-scroll-browser-report`; final picker reports and the stable
focus retry are in `.preview/picker-final-browser-report` and
`.preview/picker-stable-browser-report`. Logs use the `.preview/picker-scroll-*`
prefix. No npm publication or deployment was performed.

Physical devices, Safari, screen readers and remote CI have not been verified in
this local pass. Touch coverage uses Chrome device emulation and CDP gestures;
wheel/trackpad coverage uses browser wheel events, including small momentum-like
deltas. Those checks do not establish physical hardware behavior.
