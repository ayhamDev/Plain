---
'@plain/ui': patch
---

Paint underline tab indicators as actual thin bars instead of full-height inset
shadows, removing side artifacts during movement and in the static fallback.
Retain keyboard focus outlines and the existing indicator color/thickness tokens.

Scrollable tab lists now reveal a contrasting native scrollbar on overflow,
supporting pointer dragging, horizontal trackpad input and Shift-wheel. Add
tabs.scrollbar-size, tabs.scrollbar-thumb and tabs.scrollbar-track theme aliases
for its appearance, with a 12px default track. Preserve native tab/list refs,
selection, disabled items, RTL, reduced motion and unstyled composition.
