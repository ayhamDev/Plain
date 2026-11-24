# Expressive progress and shapes

Validated locally on **November 24, 2026**, on the working tree based on
`94cadd1`. A pending minor Changeset records the additions. The package remains
0.3.0; this work does not assign or publish a new release.

LoadingIndicator's contours and motion were subsequently corrected; see the
[Material loading motion verification](material-loading-motion.md) for its current
implementation, bundle measurement and follow-up checks. The results below record
the original integration.

## Implementation

The requested Chesai UI reference was inspected read-only. Its linear example
stretched a small SVG across the available width, distorting its stroke and gap.
P.UI now uses cubic sine segments with a pixel wavelength, rounded endpoints and
a separate remaining track. It measures logical pixels and observes the HTML
layout box so resizing and 200% zoom retain the wave spacing. The progress root
does not fill the gap with its old track background.

Progress and its LinearProgress alias support standard/wavy visuals and a gap;
segmented storage retains its existing API. CircularProgress adds standard/wavy
rings, a visible gap, optional centered content, custom size/stroke/wave geometry
and determinate/indeterminate states. Percentages use the language provider.

Shape, ShapedIcon, ShapedContainer, ShapedImage, ShapedButton, ShapedIconButton
and ShapedBadge expose 36 contours. Matching vertices enable native shape
transitions. Shape coordinates are rounded to 0.1 viewBox units to reduce transfer
size. Images preserve native image props, refs and alt text. Buttons retain the
existing Button behavior and an unclipped keyboard focus outline. The clipped
container is intended for decorative content.

LoadingIndicator uses seven precomputed contours and native SVG interpolation
and rotation, with a contained variant and pause/resume control. It adds no
animation engine or per-frame React updates. Its label uses `common.loading` or a
caller override. Server rendering provides a visible static contour. Reduced/none
motion removes the animation while preserving the status and visual shape.
The design reference is the [official Material loading indicator documentation](https://github.com/material-components/material-components-android/blob/master/docs/components/LoadingIndicator.md).
The source reference's notice is retained in the packed THIRD_PARTY_NOTICES.md.

Styled defaults use existing neutral semantic colors. New typed slots, component
tokens, tooltip support, unstyled composition and focused package entries are
available. Feature-CSS consumers add shape.css to core.css; the complete
styles.css includes it. Existing Spinner remains available.

## Verification

| Check                                             | Result                                                                            |
| ------------------------------------------------- | --------------------------------------------------------------------------------- |
| Full library suite                                | 35 files / 490 tests passed                                                       |
| Final geometry and native-contract checks         | 14 focused tests repeated after coordinate compaction and resize handling         |
| Documentation / workspace tests                   | 6 / 9 passed                                                                      |
| Typecheck, lint, workspace boundaries, formatting | Passed                                                                            |
| Library/docs builds and compiled browser examples | Passed                                                                            |
| Packed consumer                                   | 749 files, 112 compiled public examples; React 18.3.1 and 19.3.0 SSR passed       |
| Full bundle gate                                  | 131 runtime entries, 34 direct/root pairs and 12 stylesheets passed               |
| Final changed Progress import                     | 23,867 eager gzip bytes for both direct and root imports; compiled source matched |
| Production browser suite                          | 8 scenarios passed                                                                |

The full suite preceded the final coordinate compaction and resize fix; focused
tests were repeated for those changes. Bundle checks reject unrelated retained
engines. Shape and ShapedButton measured 27,806 and 31,412 eager gzip bytes;
LoadingIndicator measured 25,351 bytes, including shared dependencies and
excluding React/CSS. No existing budget was raised. The final internal sizing
change was followed by a separate Progress direct/root recheck.

Chrome **157.0.8103.79** on Windows. Production browser coverage includes
1440px light/LTR, 390px dark/LTR and 320px dark/Arabic RTL; long labels, custom
provider messages and scoped colors; visible linear/circular gaps; empty and
complete values; live resizing; 200% zoom/reflow; keyboard activation and focus;
native morphing, pause/resume and system/provider reduced motion. Automated axe
checks passed in all three appearance/width scenarios. Screenshots were reviewed
in light and dark modes. Extra documentation checks confirmed that configured
playback pauses both loaders, configured values update progress and the shape
selector changes the preview. Gallery labels have room to remain readable.

Physical devices, screen readers and remote CI were not tested.

Git-ignored evidence is in `.preview/expressive-*.log`, the validation JSON files,
`.preview/expressive-progress-bundle.json`, `.preview/expressive-doc-controls.json`
and screenshots under `apps/docs/test-results/expressive-feedback-*`. Browser
verification used `.preview/expressive-qa.config.mjs` with an isolated preview.
The user's normal docs server was not restarted or replaced.

The pre-existing modified documentation archive was restored byte-for-byte after
temporary packing and remains outside this change (SHA-256
`82b0215ce072c19c1207c22e6c8b6feba65d036937aaab6d90da8baad27ff28b`).
