---
'@plain/ui': patch
---

Use themed P.UI Select controls for Calendar month/year navigation across date
pickers, preserving localized labels, disabled options, bounds, controlled months
and custom DayPicker component overrides. Keep nested selection menus inside the
picker workflow without dismissing the parent popup.
Allow enough width for the full year label in fonts such as Inter.

Keep calendar popups fully visible when they fit the viewport instead of adding
an unnecessary scrollbar. Preserve scrolling for genuinely short viewports and
native sizing for explicit collision boundaries and custom height constraints.

Start a fresh two-click inclusive interval when editing DateRangePicker values.
The first date keeps the popup open; a valid second date completes the range and
restores focus. Retain same-day ranges, exclusion rules and native form values.
