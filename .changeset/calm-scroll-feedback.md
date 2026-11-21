---
'@plain/ui': patch
---

Soften opt-in ScrollArea edge feedback with progressive resistance, a maximum
20px desktop displacement and a quicker critically damped return. Large mouse
wheel impulses and repeated trackpad deltas stay within the same small limit.

Reduce mobile pull-to-refresh displacement to at most 40px, with a smaller loading
hold and shorter settling transition. Keep refresh activation distance unchanged,
and retain native scrolling, desktop-only wheel elasticity and reduced-motion
behavior.
