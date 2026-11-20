---
'@plain/ui': minor
---

Unify ResizableHandle and SidebarRail with a smoothly fading and growing edge
highlight. Animate entry and exit, preserve the highlight during resizing, and
leave native hit targets and layout geometry fixed. Use logical edges for both
sidebar sides and RTL. Devices without hover retain a visible affordance;
forced colors use system colors, and reduced/none motion suppresses transitions.

ResizableHandle now defaults to the edge-only appearance. Its `withHandle` default
changes from true to false; set `withHandle={true}` to retain the former grip pill.
Explicit values, custom children, native refs/handlers, keyboard resizing and the
sidebar collapse action remain supported. Add shared edge-handle color, thickness,
duration and easing theme tokens; preserve the current neutral palette.
