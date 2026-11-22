---
'@plain/ui': minor
---

Add optional temporary hover/focus expansion to SidebarProvider and NavigationRail.
Use expansionMode="overlay" to reserve compact width and expand above content with
a dismissible, themeable backdrop. Hover delays and backdrop visibility are
configurable. NavigationRail also supports controlled expanded state and width.

Preserve pinned sidebar state, native refs/handlers, keyboard focus, reduced motion,
RTL anchoring and mobile Sheet navigation. Existing inline/manual defaults remain.
