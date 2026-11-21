---
'@plain/ui': patch
---

Fix clipped ScrollArea scrollbar caps by painting a complete rounded pill instead of shrinking a rounded background with padding. Animate the painted width/height while keeping the native thumb and rail hit areas fixed. Account for rail padding so configured idle and hover sizes match their visible widths, including horizontal and RTL scrollbars. Preserve theme colors, reduced motion, custom sizing and native dragging.
