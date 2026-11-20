---
'@plain/ui': minor
---

Expose locale, timeZone, messages and translations on PlainProvider and ThemeScope.
The main provider synchronizes document language and inferred direction; scopes
keep their own language and portals without changing the application document.
Existing standalone language providers and per-component overrides remain available.

Canonicalize locale tags and merge inherited base/script/region dictionaries by
key. Format numeric string-message placeholders with Intl while retaining raw
values for function messages. Localize remaining command labels, color-picker
instructions, slider names, tag tooltips, file sizes, table filter summaries and numeric controls, and ensure
chart data alternatives inherit the provider locale. Keep default calendar labels
aligned with the engine's Gregorian geometry and localize its week numbers.
