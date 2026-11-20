# Stable time-picker interaction

Integrated after `a01e5c8`, with a pending minor Changeset for `@plain/ui`.
The manifest remains the local 0.2.0 candidate; no npm publication is implied.

TimePicker, DateTimePicker and both time range variants now open from the field
by default. Enter, Space, Arrow Up/Down and F4 also open the picker. `editable`
opts into the previous native segmented editor; the clock/calendar action and
Alt+ArrowDown continue to open the picker there. The actual input retains its
native type, ref, name, form values, required/min/max/step validation and change
handlers. Caller cancellation, disabled and read-only states remain supported.

Minute choices default to every minute. `minuteStep={5}` explicitly restores
five-minute choices. `hour12` selects AM/PM and `hour12={false}` selects 24-hour
time in the default formatted field and picker; it takes precedence over the
existing `hourCycle` setting, whose default remains `h23`. Native editable field
formatting belongs to the browser. Values remain ISO wall times, with optional
seconds and fractions, independent of the display format.

Wheel previews no longer rerender the whole picker on every scroll frame or
reset a held touch gesture. Touch retains native inertia. Mouse-wheel deltas
are normalized and small trackpad movements accumulate before settling. A
gesture commits once after scrolling stops; release clicks following a drag are
ignored. Done consumes pending columns together before closing, avoiding stale
or overwritten values. Clear and form reset discard pending gestures. Layout
row heights, independent of popup scale animations, prevent late values such as
23:55 from shifting on opening. Keyboard selection, controlled proposals,
scoped row heights, reduced motion and forced colors remain available.

Desktop popovers anchor to the whole field and retain viewport collision and
scroll containment. `popoverProps` exposes placement, collision boundaries,
sizing and native popover handlers. Compact screens continue to use bottom
sheets, with wheel gestures independent of sheet dragging. Two typed slots,
`temporal.field` and `temporal.display`, expose the formatted field structure.
The existing neutral palette, token aliases, localized labels, RTL, scoped
portals and unstyled composition remain in use. No dependency was added.

Documentation, property controls, the scheduling guide and the packed modular
consumer demonstrate the new defaults and configuration.

Validation:

- TypeScript, ESLint/workspace boundaries, formatting, library/docs builds,
  installed-package verification and the final npm pack dry run passed.
- All 304 automated tests passed: 9 workspace checks, 289 library tests and
  6 documentation tests, using `npm test -- --concurrency=1`. Eleven new cases
  cover whole-field activation and cancellation, one-minute/default intervals,
  consistent formatting, native validation/form values, editable mode, wheel and
  held-touch gestures, controlled proposals, atomic quick Done, clear/reset and
  accepting an otherwise empty picker. Existing wheel assertions were updated
  for the one-minute default and reset dismissal.
- Twenty-five Chrome 157.0.8103.79 development Playwright cases passed. Six new
  cases exercise coarse wheel and small trackpad deltas at desktop/mobile sizes,
  a held native touch gesture through CDP, consistent 12h/24h display, whole-field
  anchoring and simultaneous pending columns on quick Done. Existing cases cover
  320px and RTL layouts, precision, off-step minutes, bounds, scoped row heights,
  rotation, animated opening, reduced motion, forced colors, edge placement,
  oversized content, custom collision boundaries and nested calendar editors.
  Applicable scoped Axe scans passed, including all-rule checks on the default
  field and 12h/24h surfaces.
- Seventeen production scenarios passed: all four time/date-time picker variants
  at 1440px light/LTR, 800px dark/LTR, 320px light/LTR and 390px dark/RTL, plus a
  640x450 CSS-pixel, 2x-scale reflow check. Whole-field activation, one-minute
  selection, restored focus, a reachable Done action, viewport bounds and scoped
  WCAG A/AA scans passed. No horizontal document/panel overflow or page errors
  occurred. Sampled desktop, phone, RTL, four-column, AM/PM and reflow screenshots
  were visually inspected.
- The verified archive contains 237 files and is 526,183 bytes. All 106 public
  examples and the modular picker API consumer compile. Package SSR passes with
  React 18.3.1 and 19.3.0. The Button-only bundle remains 17,601 bytes gzip, within
  its 25kB budget, with heavy unused features excluded. The docs download archive
  was refreshed.

Evidence is in ignored `.preview/time-picker-qa/`,
`.preview/time-picker-*.log` and `.preview/time-picker-pack-final.json`.
Physical iOS/Android hardware, physical mouse/trackpad devices, Safari/WebKit,
software-keyboard behavior, screen-reader sessions and remote CI were not tested.
The reflow check emulates effective size/scale rather than operating browser zoom.
