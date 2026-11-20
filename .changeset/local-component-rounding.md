---
'@plain/ui': patch
---

Resolve the Switch thumb's automatic radius at the control so per-instance
`switch.radius` overrides update both track and thumb without changing sibling
controls or the global theme. Explicit `switch.thumb-radius` values still win;
`initial` restores automatic rounding. Document typed instance tokens, local
theme scopes with portals, and reusable component extensions.
