---
'@plain/ui': patch
---

Remove the default button hover lift and pressed scaling. Buttons keep their
position and size while retaining variant color/opacity feedback, focus outlines,
transition timing and disabled/loading behavior. Remove the now-unnecessary
reduced-motion overrides for those transforms; consumer-supplied transforms remain
application-owned.
