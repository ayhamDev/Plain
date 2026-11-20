# Calendar navigation and inverse toasts

Integrated after `049e5bc`, with a pending minor Changeset for `@plain/ui`.
The manifest remains the local 0.2.0 candidate; no npm publication is implied.

Calendar and all date picker popups now default to localized month/year dropdowns
and `navLayout="after"`, preserving visual keyboard order. Native DayPicker
selection, controlled-month callbacks, disabled dates and native form values are
retained. Navigation alone does not select a date. `captionLayout="label"`
restores the former caption; single-selector layouts remain available.

The default year window includes 100 years before and after today and explicitly
displayed outliers. A single supplied bound anchors the opposite default window.
`startMonth`, `endMonth` and `reverseYears` configure the options directly or
through `calendarProps`. Range/date-time navigation defaults to its min/max months,
including the other endpoint's constraint for ordered date/time ranges. Explicit
calendar bounds can widen navigation without enabling unavailable dates.

`calendar.month-width` and `calendar.year-width` default to 104px and 64px. The
month frame stays 236px wide between September and May in the built previews,
removing an observed 8px shift. Grids remain centered. Arabic weekday captions use
compact text while retaining full accessible weekday names. DatePicker popup names
also inherit a supplied field label or accessible name.

Toaster now defaults to `invert={true}`: dark in light mode and light in dark mode.
CSS resolves colors from each toast's effective inversion and the existing semantic
tokens. `<Toaster invert={false} />` retains the surface appearance; individual
inverse toasts under that setting also receive the correct colors. Description,
action and close-button contrast, caller style precedence and dismissal are retained.

Validation:

- ESLint/workspace boundaries, TypeScript, formatting, and the library/docs build passed.
- The full suite passed: 9 workspace checks, 219 library tests and 6 documentation
  tests. Twelve new calendar tests cover direct jumps, controlled months, bounded
  and descending options, caption variants, localization, outlying years,
  DatePicker form/ref behavior, and date/time/range constraints. Toast tests cover
  inverse defaults, explicit surface mode, native actions and style overrides.
- All 24 focused Playwright cases passed after builds and generators finished:
  five calendar/date-picker variants in desktop light/LTR and 320px dark/Arabic
  RTL, toast inversion/theme switching/actions/dismissal, surface opt-out and
  per-toast inversion, plus existing time-popup, collision-boundary and nested
  event-dialog regressions. Month frames remained stable during navigation;
  keyboard order, disabled dates, native submitted values and restored focus passed.
- Package validation passed: 217 files in the 475,246-byte archive, 103 compiled
  examples, exported CSS/subpaths, and SSR with React 18.3.1 and 19.3.0. The
  Button-only bundle remains 20,020 bytes gzip within its 25kB budget; heavy
  features stay excluded.
- Nine production-page scenarios passed in Chrome 157.0.8103.79: Calendar,
  DatePicker and Toast at 1440px light/LTR, 320px light/LTR and 390px dark/RTL.
  Direct jumps, actual date selection, stable month widths, inverse surfaces and
  toast actions passed without page errors, document overflow or detected Axe
  WCAG A/AA violations in the changed states. Screenshots were inspected.

Local evidence is in the ignored `.preview/calendar-toast-qa/` directory, including
`production.json` and built-page screenshots. Logs are in
`.preview/calendar-toast-*.log`; Playwright captures are under
`apps/docs/test-results/`. Coverage is scoped to this change. Other browser engines,
physical devices, actual browser zoom and screen-reader sessions were not tested.
