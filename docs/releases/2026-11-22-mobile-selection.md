# Mobile selection, localization and RTL

Validated locally on 2026-11-22, based on `1751dc3`. A minor Changeset records
the new presentation API. The package remains 0.2.0; no registry publication or
deployment was performed.

`AGENTS.md` and `CONTRIBUTING.md` now require mobile interaction, localization
and RTL review for UI changes: deliberate surface selection, 320px reflow, long
translations, safe areas, software-keyboard space, focus return, scoped portals
and one intentional scrolling body. Physical-device coverage must be recorded
separately from emulation.

Phone country search defaults to a bottom sheet below 768px and a popover on
larger screens. Select, Combobox and MultiSelect preserve their popover defaults
and accept `presentation="auto"`, `"sheet"` or `"popover"`. Their `sheetTitle`
overrides are application-owned text. The docs playgrounds, API tables, guide,
README and installed-consumer fixture cover the new options.

Searchable sheets keep the original trigger and form owner mounted, use one
scrolling list, reserve room for dismissal, provide 44px option targets, and
track the visual viewport when a software keyboard reduces usable height.
Pointer opening focuses the heading; keyboard opening can focus search. Multiple
selection stays open until Done, with selection limits, native validation and
focus return. Presentation stays fixed for an open searchable session. Native
Select retains Radix selection, typeahead, form and dismissal behavior, including
its existing resize dismissal, while using a named dialog and listbox in sheet
mode. The implementation does not add a second focus trap to native Select.

The library already localizes its internal text through the providers. The
source audit found no literal English JSX text or labels/placeholders in the UI
modules; existing localization tests also check that Arabic covers every message
key. This change fixes missing provider direction on generic popovers, dialogs
and alert dialogs, propagates per-control direction into selection portals, and
isolates phone digits, ISO codes and calling codes as LTR. Caller labels and data
remain application-owned.

Verification:

- 162 focused UI tests passed: 13 selection-surface cases, 94 phone/input/library/
  localization/refinement regressions, and 55 mobile-picker/calendar/date-chart
  regressions. One existing mobile-picker case exceeded its five-second timeout
  during parallel build checks; the complete 55-test calendar group passed with
  one worker and a 15-second limit. Six docs-preview tests and nine repository
  script tests passed.
- Fourteen Chrome browser checks passed on the final compiled fixture at 320px
  RTL, 390px dark/LTR and 1440px desktop, plus a 320x480 phone case. They cover
  one scrolling region, bounded placement, header spacing, 44px touch targets,
  mouse/keyboard selection, CDP touch scrolling and RTL touch selection, native
  form values, limits, focus restoration, explicit overrides, open-session
  resize, nested dialogs and a simulated keyboard-reduced visual viewport.
  Axe scans passed for the exercised open surfaces. Geometry checks wait for
  animated sheets to settle. Native Select captures avoid full-page screenshot
  resizing, which intentionally dismisses its Radix popup.
- Mobile country sheets and RTL Select captures were visually inspected. The
  existing source docs server on 5173 also passed a mobile country-sheet/reflow
  smoke check without being restarted. Compiled browser QA used an owned 5226
  preview.
- TypeScript, ESLint, formatting, workspace boundaries, library/docs builds,
  Changesets planning and installed-package verification passed. The installed
  consumer compiled 108 examples; React 18.3.1 and 19.3.0 SSR passed. Eager Button
  and Layout budgets remain 19,512 and 17,776 bytes gzip, with heavy selection
  engines excluded from those bundles. The docs package archive was refreshed.

Evidence is under `.preview/selection-*`. Physical devices, real mobile software
keyboards, screen readers, other browser engines, remote CI and the full repository
test suite were not run.
