---
'@plain/ui': minor
---

Extend TabsList's existing underline presentation with full-width baselines,
scrollable overflow, three sizes and configurable indicator thickness. Keep the
current segmented/intrinsic/medium defaults. Export TabsListProps and add semantic
tokens for the baseline and indicator. A 1px underline gives compact section tabs
with label-sized selection, using P.UI's own neutral defaults.

Reveal selected tabs inside scrollable lists on initial/controlled selection and
layout changes, without scrolling the page or snapping back during manual list
scrolling. Keep this behavior when animated is false. Preserve keyboard semantics,
disabled tabs, native refs, RTL, styling slots and unstyled composition. Shared
indicator motion still follows system/provider reduced-motion policy.
