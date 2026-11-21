---
'@plain/ui': patch
---

Let sheets and drawers drag from non-interactive areas by default. Guard pointer initiation before the engine captures controls, preserving sliders/tracks, inputs, links, text selection, nested scrolling and custom data-vaul-no-drag regions. Retain handleOnly as an explicit option and arbitrate touch scrolling without replacing native scrolling or Vaul's drag/snap engine. Prevent injected production CSS from recreating an invisible scroll tail. Update the documentation and playground defaults.
