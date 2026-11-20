---
'@plain/ui': minor
---

Make time and date-time pickers open from the whole field by default, with
consistent localized 12-hour or 24-hour formatting. Add `hour12`, `editable` and
`popoverProps` across the single and range picker APIs. Set `editable` to retain
the previous native keyboard editor; `hourCycle` remains supported and defaults
to `h23`.

Default minute choices to one-minute intervals. Set `minuteStep={5}` to retain
five-minute choices. Stabilize mouse-wheel, trackpad and native touch gestures,
commit each settled gesture once, and accept pending columns together on Done.
Prevent animated popup geometry from shifting the selected time. Clear and form
reset discard pending gestures. Anchor desktop popovers to the whole field while
preserving viewport collision handling, native validation, form values, refs,
localization, scoped styles and mobile bottom sheets.
