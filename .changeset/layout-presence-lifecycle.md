---
'@plain/ui': minor
---

Add opt-in `presence` support for keyed children throughout layout primitives,
cards and card sections, scroll areas, sidebar containers, AppShell main content,
tab/disclosure content, table row groups and resizable panels. Export
`LayoutPresence` and shared options from the root and layout entry for custom
containers. Support initial entrances, additions, retained exits, reentry,
optional reflow, bounded staggering, animation limits and configurable timings.

Use native Web Animations without per-frame React updates or added DOM wrappers.
Keep exiting content inert and out of forms, preserve refs and keyed child state,
and immediately remove content with reduced/none motion or unavailable animation
support. Share one system motion preference listener across enabled consumers;
static layouts do not subscribe or measure geometry. Preserve server-visible
content and existing engine-owned disclosure/virtualization lifecycles.
