---
'@plain/ui': minor
---

Make ScrollArea's opt-in `elastic` feedback work with desktop mouse wheels and
trackpads on both axes, including RTL, Shift-wheel and pixel/line/page delta units.
Use bounded resistance and a smooth spring return without taking ownership of
native scroll positions or changing scroll/scrollbar dimensions. Honor canceled
consumer events, nested scrollers, form controls, zoom gestures and keyboard focus.

The existing boolean now enables desktop feedback rather than touch-only
resistance. It is inactive below 768px, without fine-pointer/hover support, for
touch gestures and with reduced/none motion. `onRefresh` remains a separate,
explicit touch pull-to-refresh option and is never triggered by wheel feedback.
