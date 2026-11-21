# Persistent range selection and a single field surface

Integrated after `53900e2`, with a pending patch Changeset for `@plain/ui`.
The local package remains 0.2.0. Validation date: 2026-11-21.
No npm publication or deployment is implied.

DateRangePicker previously closed its desktop popover when the second endpoint
was selected. It now stays open after either selection, including when editing
another range without reopening the calendar. Desktop values still update as
dates are selected. A localized Done action, Escape or outside interaction
dismisses the popover and restores focus. Done does not emit another selection
event. Mobile sheets retain their pending draft, confirmation and cancellation
behavior. Native values, controlled/uncontrolled state, date restrictions,
keyboard selection, required validation, clearing and reset remain supported.

The field wrapper and its inner trigger previously both painted a border and
background, producing the stacked appearance. The trigger now shares the
borderless, transparent treatment used by the other temporal fields inside their
wrapper. The outer wrapper owns the field border and focus outline. Focus does
not add another outline to the trigger or make the field border thicker. Native
button refs, props and handlers remain on the trigger. Existing temporal tokens
and styling slots remain available, with a new `date-range-picker.footer` slot.
No dependency, public prop or component export was added.

Validation:

- All 372 tests passed: 9 infrastructure, 357 library and 6 docs tests. The final
  full run used `--concurrency=1 -- --testTimeout=15000 --maxWorkers=1`.
  An initial two-worker run timed out in the existing mobile date-only reset
  test; that test passed in the full serial run. Repository timeout settings
  were not changed. The focused range/mobile set also passed all 40 tests.
- Workspace TypeScript, ESLint, dependency boundaries, formatting, Changesets
  status, library/docs builds and package-content checks passed. Installed-package
  verification compiled 106 examples and checked React 18.3.1/19.3.0 server
  rendering. The archive contains 261 files and is 583,975 bytes. Button/layout
  gzip sizes remain 17,445/15,787 bytes.
- Chrome 157.0.8103.79 verified 50 unique browser scenarios: 46 calendar, mobile
  picker, popover and toast checks; three final field-surface checks; and one native
  keyboard/form scenario in Pacific/Kiritimati. These cover both endpoint
  clicks, repeated editing, single borders/backgrounds, one field focus outline,
  Done/Escape/outside dismissal, focus return, local date submission, required
  validation, disabled days, reset, clearing, RTL, month/year navigation,
  short/narrow screens, nested dialogs and popup boundaries. The surface subset
  was rerun after its harness was adjusted to inspect the mobile modal's
  intentionally hidden background through the public styling slot.
- Production docs passed at 1440x1000 light/LTR/system motion/1x density,
  720x1000 dark/LTR/no motion/2x density, 320x900 light/LTR/system motion/1x
  density and 390x900 dark/RTL/reduced motion/2x density. Each profile retained
  the popup through both selections, kept Done reachable and returned focus on
  dismissal. Desktop edits remained live; mobile unconfirmed edits were
  discarded on Escape. Empty and populated fields retained one border and the
  outer focus outline. Scoped Axe WCAG A/AA checks reported no violations, and
  pages reported no runtime errors or horizontal overflow. Screenshots were
  visually inspected, including empty phone fields, the desktop Done footer and
  dark RTL fields/sheets.

Evidence is in `.preview/date-range-surface-typecheck.log`,
`date-range-surface-all-tests-serial.log`, `date-range-surface-unit.log`,
`date-range-surface-lint.log`, `date-range-surface-format-check.log`,
`date-range-surface-changesets.log`, `date-range-surface-build.log`,
`date-range-surface-package.log` and `date-range-surface-pack.json` under
`.preview/`. Browser evidence is in `.preview/date-range-surface-browser.log`,
`.preview/date-range-surface-final-browser.log`,
`.preview/date-range-surface-form.log` and their reports. Production results and
screenshots are in `.preview/date-range-surface-qa/production.json` and the same
directory. Physical devices, Safari, screen readers and remote CI were not
verified here.
