---
'@plain/ui': patch
---

Keep the background of attached viewport Sheets and Drawers continuous when they
are pulled past their resting edge, in every direction. A decorative layer follows
the panel's native motion and computed background without changing its scrollport,
content layout, hit area or snap dimensions. Remove the clipped Vaul pseudo-element
that also added empty scroll space. Detached, floating and unstyled panels retain
their intended gaps and presentation.
