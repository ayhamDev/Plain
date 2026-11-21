---
'@plain/ui': patch
---

Make full-size Sheet and Drawer panels fill the viewport on every edge, overriding their configured gap and width limit. Full viewport snap points also remove detached gaps and cross-axis constraints as they expand. Corners progressively flatten over the last 64px of travel, follow native Vaul drag/snap animations and restore when collapsed, while reduced motion, custom containers, refs and native interaction remain available.

Allow long mobile picker sheets to use the full viewport height, and retain a continuous background when full panels are pulled beyond their resting edge.
