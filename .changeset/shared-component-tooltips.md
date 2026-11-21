---
'@plain/ui': minor
---

Add a shared tooltip prop to rendered components and compound triggers. Pass text or a configurable content object to use P.UI's accessible tooltip, including placement, delay, open state, native content props and opt-out. Existing names, descriptions, refs, form participation and consumer event cancellation are preserved. Disabled actions support a keyboard-focusable explanation. PlainProvider accepts default tooltip settings, and existing TooltipProvider scopes and the compound tooltip API remain supported.

Tooltip behavior loads separately for configured tooltips and adopts the existing DOM anchor without remounting the control. A failed optional tooltip module leaves the native control usable. Components without the prop keep their native markup. Renderless providers/roots use their rendered trigger as the anchor; chart data-tooltip props retain their existing meaning.
