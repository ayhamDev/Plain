# Textarea resize controls

Validated locally after `98bdf2d` on 2026-11-21. A minor Changeset records the
compatible `@plain/ui` API addition; this does not imply publication or deployment.

Textarea exports `TextareaProps` and accepts `resize="none" | "vertical" |
"horizontal" | "both"`. The existing vertical default remains. `none` removes the
native resize handle, while the other modes use the browser's native resizing.
Styled textareas stay within the parent width, and Field now has a zero minimum
width so resized children do not widen flex/grid columns. Native refs, values,
form props, appearance variants and styling overrides remain available. Unstyled
consumers own CSS, with the requested mode available through `data-resize`.

The API table, interactive Textarea playground and copyable code document all
four modes. Root and forms-subpath consumer examples use the new prop/types.

Validation:

- Fourteen existing input regression tests and all six docs tests passed. Docs
  tests compile every playground default, enum choice and boundary as complete
  copyable TSX, including the four resize modes.
- Twelve Chrome scenarios passed against compiled library/docs code: four new
  native resize/editing/form scenarios plus eight input appearance regressions.
  Real mouse drags verify fixed sizing, allowed axes, width containment, retained
  text, dynamic mode changes, ref focus and native form submission at 1000px
  light/LTR, 390px dark/LTR and 320px light/RTL. Existing scenarios cover all input
  variants, focus outlines, disabled/invalid states and picker interaction.
  Automated Axe checks and document overflow checks passed. The narrow RTL
  capture was visually inspected.
- TypeScript, ESLint, workspace boundaries, formatting, library/docs builds,
  Changesets planning and diff checks passed.
- Installed-package verification compiled 106 documented examples and the
  consumer fixture. All four modes rendered on the server with React 18.3.1 and
  19.3.0 without leaking a native `resize` attribute. The refreshed docs archive
  contains 291 files and is 626,834 bytes. Eager Button/Layout gzip remains
  19,512/17,776 bytes with the existing heavy-feature exclusions enforced.

Private evidence is under `.preview/textarea-resize-*`. Narrow viewport checks
use desktop Chrome's native mouse resize handle; physical touch-device and
screen-reader tests, other browser engines and remote CI were not performed.
Native resize-handle availability remains browser/platform dependent.
