# QR code draw animation

Validated after `853bfa2` on 2026-11-21, with a pending minor Changeset for
`@plain/ui`. The local package remains 0.2.0. No npm publication or deployment
is implied.

All previous QR animation effects are replaced by one draw sequence. The three
finder frames and centers trace into place, followed by alternating strokes that
write the stationary pattern. The mask releases after the sequence to restore
unmasked rendering. Drawing defaults to 1000ms, runs once on mount or encoded
content changes, and replays when the encoder version/mask or circular layout
changes. Timing uses the existing duration/delay tokens and library motion scale.
Animation opt-out, zero duration, unstyled mode, provider reduced/none policies
and system reduced-motion preferences retain a complete static code.

`animation={{ preset: 'draw' }}` selects the new effect explicitly. The old
assemble/scan/reveal/fade values remain accepted as aliases for draw. Their
implementations and docs choices are removed. The new `qr-code.draw-stroke`,
`draw-anchor`, `draw-center` and `draw-complete` slots replace the former
motion-tile/motion-anchor/scan slots. The docs retain animation and replay
controls. Native SVG props, refs, handlers and accessible descriptions remain on
the image. Encoded geometry, circular decoration, gradients, logos and custom
renderers are preserved. No dependency was added.

The mask is bounded to 48 writing strokes and three finder treatments, with at
most 58 CSS animations including mask retirement. It adds no per-module animation,
JavaScript frame loop or repeated layout measurement. The default aggregated
pattern paths remain unchanged. Standalone downloads contain complete codes even
when captured during drawing.

Validation:

- All 372 repository tests passed: 9 infrastructure, 357 library (including 22 QR
  tests) and 6 docs tests. The full run used
  `--concurrency=1 -- --testTimeout=15000 --maxWorkers=1`. An initial isolated run
  lost its sandbox temporary transform cache; the final run outside that
  isolation passed. Repository timeouts were not changed.
- Final TypeScript, ESLint, workspace boundaries, formatting, Changesets status,
  library/docs builds, package verification and pack dry-run passed. Installed
  package checks compiled 106 examples and verified React 18.3.1/19.3.0 server
  rendering. The refreshed docs archive contains 261 files and is 584,576 bytes.
  Button/layout gzip sizes remain 17,445/15,787 bytes.
- Chrome 157.0.8103.79 passed all 43 QR browser tests. These cover square/circular
  layouts, module/finder styles, all correction levels, rotation, Unicode,
  custom rendering, gradients/logos, value updates, downloads during drawing,
  aliases, live motion preferences, unstyled output, forced colors and version-40
  mask bounds. Mid-animation masks and their retirement were verified. An initial
  run encountered animation cancellation during development file regeneration;
  the final run completed after that build activity stopped.
- Five additional frame sequences verified progressive ink coverage, identical
  finished SVG paths, released masks and successful decoding. Default square and
  circular 240px outputs matched static screenshots exactly. Gradient and dense
  circular raster captures had small antialiasing differences; their SVG geometry
  matched and their screenshots decoded correctly.
- Source docs and compiled docs passed at 1440x1000 light/LTR/system motion/1x
  density, 720x1000 dark/LTR/no motion/2x, 320x900 light/LTR/system motion/1x and
  390x900 dark/RTL/reduced motion/2x. Both shapes decoded in each profile; compiled
  replay timing, animation bounds and mask retirement passed. Scoped Axe WCAG A/AA
  audits reported no violations, with no page errors or horizontal overflow.
  Narrow-screen, RTL, intermediate drawing and completed screenshots were
  visually inspected.

Evidence is in `.preview/qr-draw-typecheck-final.log`, `qr-draw-unit-final.log`,
`qr-draw-lint.log`, `qr-draw-format.log`, `qr-draw-changesets.log`,
`qr-draw-build.log`, `qr-draw-package.log`, `qr-draw-pack.json` and
`qr-draw-final-browser.log` under `.preview/`. Additional reports and screenshots
are in `.preview/qr-draw-qa/visual.json`, `production.json` and the same directory.
Physical devices, Safari, screen readers and remote CI were not verified here.
