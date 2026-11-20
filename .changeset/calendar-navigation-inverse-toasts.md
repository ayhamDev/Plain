---
'@plain/ui': minor
---

Enable localized month/year dropdowns by default in Calendar and all date picker
popups, with keyboard order matching the caption and navigation controls. The
default year window includes 100 years in either direction and explicitly
displayed outlying years. Configure `startMonth`, `endMonth`, `reverseYears` and
`captionLayout` directly or through `calendarProps`; `captionLayout="label"`
restores the previous caption. Range and date/time pickers use their min/max
months as default navigation limits without changing date selection validation.
Selector widths stay stable between month names and can be overridden with
`calendar.month-width` and `calendar.year-width`. Compact Arabic weekday text
retains full accessible weekday labels.

Make toasts inverse by default: dark in light mode and light in dark mode, using
the existing semantic toast tokens. Set `invert={false}` on Toaster for the
surface appearance. Caller styles, actions and dismiss controls remain supported.
