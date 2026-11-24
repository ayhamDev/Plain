---
'@plain/ui': patch
---

Correct LoadingIndicator's Material motion: preserve the original cubic contours and proportions, use feature-matched transitions with a brief settle, and combine spring-driven quarter turns with an independent slow rotation. The default cadence is 650ms per shape (4550ms for seven shapes). Native timelines preserve pause/resume, reduced motion, localization and SSR without adding an animation engine.
