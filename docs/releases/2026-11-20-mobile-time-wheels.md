# Adaptive mobile time wheels

Integrated after `493b0b8`, with a pending minor Changeset for `@plain/ui`.
The manifest remains the local 0.2.0 candidate; no npm publication is implied.

TimePicker, DateTimePicker and both range variants now open a bottom sheet below
768px. `pickerMode="auto"` uses time wheels there and select controls in a desktop
popover. Explicit `select`/`wheel` modes choose the controls independently of the
compact sheet presentation. An open surface remains stable across rotation;
subsequent openings follow the new viewport size.

Native [CSS scroll snapping](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type)
provides touch inertia and centered rows. Wheel columns retain independent
scrolling, a neutral selection band, faded edges and optional perspective text.
Keyboard behavior follows the [WAI spinbutton pattern](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/).
The native input still owns refs, values, change events, names, validation and
form reset. Temporal continues to handle wall-time updates and bounds; seconds,
fractions and AM/PM remain intact. No runtime dependency was added.

Seven new styling slots and four wheel aliases support scoped customization.
Labels and values respect localization and RTL. Reduced/none motion removes the
perspective treatment; forced colors removes the fade mask. Keyboard focus is
painted inside the selected row so the scroll body cannot clip it. Calendar/time
content scrolls inside the sheet while its header and Done action stay outside
that body. Only the handle drags the sheet. Documentation, property controls and
the packed consumer demonstrate the new mode.

Validation:

- TypeScript, ESLint/workspace boundaries, formatting, library/docs builds,
  installed-package verification and the npm pack dry run passed.
- All 267 automated tests passed: 9 workspace checks, 252 library tests and
  6 documentation tests. Nine new wheel tests cover native input/ref/event/form
  contracts, controlled proposals, precision, AM/PM, non-uniform minute intervals,
  date/time bounds, reset, range ordering, localization, unstyled slots, SSR and
  mobile sheet focus restoration.
- Nineteen Chrome 157.0.8103.79 Playwright cases passed. Eight new cases cover
  native touch input dispatched through CDP, wheel scrolling, snapping without
  sheet movement, four columns at 320px, fractional seconds, custom portal tokens,
  bounds, keyboard focus, mode selection, rotation, animated opening, system
  reduced motion and forced colors. Eleven existing picker/popover cases cover
  edge placement, scrolling, custom boundaries and nested event calendars.
  Applicable scoped Axe WCAG A/AA scans passed.
- Sixteen production checks passed across TimePicker, TimeRangePicker,
  DateTimePicker and DateTimeRangePicker at 1440px light/LTR, 800px dark/LTR,
  320px light/LTR and 390px dark/RTL. The expected select/wheel presentation,
  selection, focus restoration, reachable Done action, viewport bounds and scoped
  Axe scans passed, with no page errors or horizontal overflow. Sampled desktop,
  phone, RTL, four-column and native-touch screenshots were visually inspected.
- The verified archive contains 233 files and is 507,401 bytes. All 105 public
  examples and the modular picker/type consumer compile. Package SSR checks pass
  with React 18.3.1 and 19.3.0. The Button-only bundle remains 20,174 bytes gzip
  within its 25kB budget. The docs download archive was refreshed.

Evidence is in ignored `.preview/time-wheel-qa/`, `.preview/time-wheel-*.log` and
`apps/docs/test-results/`. Physical iOS/Android hardware, Safari/WebKit, a physical
trackpad, software-keyboard behavior and screen-reader sessions were not tested.
