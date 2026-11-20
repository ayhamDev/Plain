---
'@plain/ui': patch
---

Remove List's persistent selected-row fill so checked checkboxes indicate selection.
Use the same normal hover feedback for enabled rows in browse and selection modes,
without sticky synthetic hover on touch devices. Preserve selection state, handlers,
bulk actions, data-selected, styling slots and native checkbox semantics.
Keep disabled item text readable while the checkbox communicates that selection
is unavailable.

Constrain list content, metadata and bulk actions to their available width. Fix
mobile table sheet overflow with shrinking sort tracks, content bounds and one
vertical scroll region, while keeping the completion action visible and room for
focus outlines. Stack sort labels above controls on narrow screens. Preserve
native Select and sheet keyboard/focus behavior and the existing design tokens.
