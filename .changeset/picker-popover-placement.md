---
'@plain/ui': patch
---

Keep Hour, Minute and optional time fields side by side in a viewport-bounded
picker. Preserve native values, constraints, localization, styling slots and focus
restoration.

Constrain shared PopoverContent to the space reported by Radix on both axes, with
internal scrolling for tall content. Default collision padding to 8px and sticky
positioning to always so edge triggers can shift the popup fully into view.
Native collision and placement props and consumer sizing overrides remain available.
