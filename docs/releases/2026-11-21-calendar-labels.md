# Readable calendar selectors

Integrated after `7fdc094`, with a pending patch Changeset for `@plain/ui`.
The local package remains 0.2.0; no npm publication or deployment is implied.
Validation date: 2026-11-21.

Month and year controls now size from their full text. The existing
`calendar.month-width` and `calendar.year-width` tokens act as minimums, while
larger fonts and localized labels can expand the controls. Default ellipses are
removed. Constrained headers wrap the controls while reserving space for the
navigation arrows. Header and day-grid widths match, with dates centered in
their columns. Mobile date-time sheets align the calendar with the time fields.

Calendar sizing uses normal style classes so consumer width classes and inline
styles remain available. No label-measuring JavaScript, extra DOM, dependencies
or public API were added. Unstyled composition and native DayPicker controls,
selection, bounds, focus and localization retain their existing contracts.

Validation:

- All 348 workspace tests passed: 9 workspace checks, 333 library tests and 6
  docs tests. TypeScript, ESLint, workspace boundaries, formatting, Changesets,
  library/docs builds and package-content checks passed.
- Installed-package verification compiled 106 examples and checked React 18.3.1
  and 19.3.0 server rendering. The archive has 249 files and is 548,547 bytes.
  Button and layout gzip sizes remain 17,445 and 15,787 bytes.
- Chrome 157.0.8103.79 passed 52 development browser scenarios. Twenty directly
  verify complete labels, actual loaded Inter fonts, arrow clearance, matching
  header/grid widths and horizontal overflow across standalone Calendar,
  DatePicker, DateRangePicker, DateTimePicker and DateTimeRangePicker. Profiles
  include 1000px English, 320px English, 320px Polish with 18px selector text,
  and 390px Arabic/RTL with 18px text. Existing picker, range, nested-popup,
  constrained-boundary, focus and scoped Axe regressions also passed.
- Fifteen production workflows passed at 1440x900 light/LTR, 1000x600 dark/RTL
  and 320x760 light/LTR, including both date-time range endpoints. They checked
  full labels, matching widths, mobile time-field alignment, dismissal, page
  errors and document overflow. Scoped Axe WCAG A/AA scans passed for the open
  date-time picker at each profile. Representative localized, desktop/RTL and
  mobile screenshots were visually inspected.

Evidence is in `.preview/calendar-labels-report`, `.preview/calendar-labels-qa`
and logs with the `.preview/calendar-labels-` prefix. Production measurements are
in `.preview/calendar-labels-qa/results.json`. Physical devices, Safari, screen
readers and remote CI were not verified in this local pass; phone coverage uses
Chrome viewport emulation.
