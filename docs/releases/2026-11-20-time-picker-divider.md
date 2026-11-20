# Time-only picker divider correction

Integrated after `ea4aab6` with a pending patch Changeset for `@plain/ui`.
The local 0.2.0 manifest is unchanged; no npm publication is implied.

The shared time-choice styles previously added a leading divider and 16px top
padding in every picker. Both now apply only when a calendar immediately precedes
the controls. TimePicker and TimeRangePicker open without an empty section above
their labels; DateTimePicker retains the calendar/time separator. No APIs or
control behavior changed.

Validation:

- TypeScript, ESLint/workspace boundaries, formatting, library/docs build,
  package verification and the npm pack dry run passed.
- Six existing Chrome 157.0.8103.79 picker browser cases passed, covering inline
  time choices, select interaction, viewport containment, scoped Axe scans,
  dismissal/focus restoration and nested event-calendar pickers. Coverage includes
  320px, 390px and desktop widths with LTR/RTL. No new unit tests were added for
  this CSS-only change.
- Twelve production checks passed: TimePicker, TimeRangePicker and DateTimePicker
  at 1440px light/LTR, 800px dark/LTR, 320px light/LTR and 390px dark/RTL. Divider
  presence, top spacing, inline controls, viewport bounds, selection, dismissal
  and focus restoration passed, with no page errors, horizontal overflow or
  detected scoped Axe violations. Screenshots were inspected after opening
  animations settled.
- The refreshed archive has 229 files and is 498,727 bytes. All 105 public examples
  compile, React 18.3.1/19.3.0 SSR passes, and the Button-only bundle remains
  20,144 bytes gzip within its 25kB budget.

Evidence is in ignored `.preview/time-picker-divider-qa/`,
`.preview/time-picker-divider-*.log` and `apps/docs/test-results/`. Physical
devices, other browser engines and screen-reader sessions were not tested.
