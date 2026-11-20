---
'@plain/ui': patch
---

Keep Input, Textarea and SelectTrigger borders at their resting color during
focus instead of recoloring them with the focus ring. Retain the existing outer
focus outline, its theme tokens and invalid-state styling. Filled, ghost and
borderless fields remain borderless while focused.
