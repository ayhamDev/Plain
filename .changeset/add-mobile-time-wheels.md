---
'@plain/ui': minor
---

Use an adaptive bottom sheet with iOS-style time wheels below 768px for time,
date-time and range pickers. Native scrolling provides touch inertia and snapping,
with independent hour/minute, optional AM/PM and second columns, keyboard controls,
localized values, reduced-motion support and typed styling slots/theme aliases.

Add pickerMode="auto" | "select" | "wheel" to choose time controls. Auto keeps
select popovers on desktop. Preserve native inputs, refs, change events, form
values, controlled state, reset, bounds, precision and focus restoration. Wheel
gestures do not drag the sheet; its header and Done action stay outside the
scrollable calendar/time body.
