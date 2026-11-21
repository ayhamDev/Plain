# Mobile date selection and QR motion

Integrated after `1f7cf75`, with two pending minor Changesets for `@plain/ui`.
The local package remains 0.2.0. Validation date: 2026-11-21.
No npm publication or deployment is implied.

DatePicker and DateRangePicker now open bottom sheets below 768px, with larger
date summaries, touch calendars and fixed Cancel/Done actions. Range sheets show
two vertically stacked months by default; `calendarProps.numberOfMonths` can
override the count. Mobile DateTimePicker separates date and time selection into
two steps. Back retains both the draft and the viewed calendar month. Done commits
the date/time once; Cancel, Escape, outside dismissal and reset discard pending
edits. DateTimeRangePicker uses the same flow for each endpoint. Standalone
TimePicker retains its live updates, and desktop pickers retain their popovers.

The shared private sheet surface preserves styling slots, focus return, native
forms and change cancellation, controlled values, disabled dates, time bounds,
localized labels and RTL direction. An open surface stays stable across rotation.
Short screens use compact headers and three visible wheel rows, with confirmation
actions outside the scroll body. Calendar cells fit the actual body width,
including RTL scrollbar gutters. Hidden date content retains navigation state
while focus moves to the visible time controls. No dependency or public component
export was added.

QRCode now defaults to a 600ms assembly treatment. Finder anchors appear first,
then a bounded grid reveals the stationary encoded pattern. The new `scan` preset
uses a soft mask sweep. `reveal` remains an alias for `assemble`; `fade`, explicit
timings and animation opt-out remain available. Assembly uses 64 mask tiles and
three finder anchors regardless of matrix density. Encoded paths, quiet zones,
gradients, logos and circular silhouettes retain their geometry. Motion runs once
on mount/content changes, respects system/provider motion preferences and exports
as a complete static SVG even during an animation. The public docs and playground
include both treatments.

Validation:

- All 369 tests passed: 9 infrastructure, 354 library and 6 docs tests. The full
  run used `--concurrency=1 -- --testTimeout=15000 --maxWorkers=2`; repository
  timeout settings were not changed. New tests cover staged edits, Back,
  cancellation, native forms/events, supplied disabled dates, bounds and
  localization.
- Workspace TypeScript, ESLint, dependency boundaries, formatting, Changesets
  status, library/docs builds and package-content checks passed. Installed-package
  verification compiled 106 examples and checked React 18.3.1/19.3.0 server
  rendering. The archive contains 261 files and is 582,305 bytes. Button/layout
  gzip sizes remain 17,445/15,787 bytes.
- Chrome 157.0.8103.79 passed 52 final picker browser scenarios and 26 QR
  scenarios. Picker checks cover 320px through desktop, light/dark, localized RTL,
  short landscape, full month/year labels, range confirmation, Back, focus,
  rotation, popover boundaries, nested event dialogs and mouse-wheel, trackpad and
  native touch interaction. QR checks cover both new presets and the legacy alias,
  square/circular codes, gradients/logos, bounded version-40 masks, motion policies,
  replay, decoding and SVG download during a scan. The QR cases passed in the
  broader run; the full picker subset passed after its focus correction.
- Production docs passed at 1440x1000 light/LTR/system motion, 720x900
  dark/LTR/no motion, 320x760 light/LTR/system motion and 390x844 dark/RTL/reduced
  motion. All 12 picker workflows retained focus, stayed in the viewport and
  avoided horizontal document overflow. Scoped Axe WCAG A/AA checks reported no
  violations, pages reported no runtime errors, and both QR presets decoded in
  all four profiles. Screenshots were visually inspected, including the narrow
  two-step flow, dark RTL range sheet and intermediate QR frames.

Evidence is in `.preview/mobile-qr-typecheck.log`, `mobile-qr-unit.log`,
`mobile-qr-lint.log`, `mobile-qr-build.log`, `mobile-qr-package.log`,
`mobile-qr-format-check.log`, `mobile-qr-pack.json` and `mobile-qr-changesets.log`
under `.preview/`. Browser evidence is in `.preview/mobile-qr-verified-browser.log`,
`.preview/mobile-qr-picker-final.log` and their reports. Production results and
screenshots are in `.preview/mobile-qr-qa/production.json` and the same directory.
Touch uses Chrome emulation; physical devices, Safari, screen readers and remote
CI were not verified here.
