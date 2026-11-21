# Integrated circular QR field

Integrated after `0571489`, with a pending minor Changeset for `@plain/ui`.
The local package remains 0.2.0. Validation date: 2026-11-21.
No npm publication or deployment is implied.

The earlier circular composition left a blank square quiet zone between the
encoded matrix and its decorative outer modules. This created detached arcs and
gave the matrix less of the available SVG area. Some versions also placed the
outer modules on a different grid from the matrix.

`shape="circle"` now defaults to an integrated field on the matrix's own grid.
The complete encoded square occupies more of the canvas, data dots use 90% scale,
and deterministic outer dots continue the composition without a square blank
band. Outer dots fit inside the circular boundary without clipped edges. Light
separators extend around the three finder patterns. Circular finders use a ring
of 24 closely spaced round dots with a solid round center; the combined path uses
nonzero fill so overlapping dots retain their ink. Encoded bits and full-size
function modules remain unchanged. The default renderer still batches geometry
into paths rather than creating a DOM element for each module.

`finderShape="dots"` is also available independently. Centers can be overridden;
`finderCenterShape="dots"` means a solid round center. `circlePattern={true}` and
`"integrated"` select the integrated layout, `"separated"` retains a blank square
quiet zone, and `false` removes the outer field. Integrated margin surrounds the
full silhouette and differs from the standard square quiet zone. The API docs
and package README explain that distinction and the separate-layout option.
Square defaults, explicit geometry/color overrides, refs, ARIA, custom renderers,
gradients, logos, deterministic SSR, reduced motion and portable SVG exports
remain available. The outer field inherits the data gradient/ink unless given
`circlePatternColor`. No dependency or new public component export was added.

Validation:

- All 372 tests passed: 9 infrastructure, 357 library and 6 docs tests. The full
  run used `--concurrency=1 -- --testTimeout=15000 --maxWorkers=2`; repository
  timeout settings were not changed. New library checks verify unchanged encoded
  data/function paths, deterministic decoration, full margins in separated/plain
  layouts and independent dotted finder styling.
- Workspace TypeScript, ESLint, dependency boundaries, formatting, Changesets
  status, library/docs builds and package-content checks passed. Installed-package
  verification compiled 106 examples and checked React 18.3.1/19.3.0 server
  rendering. The archive contains 261 files and is 583,826 bytes. Button/layout
  gzip sizes remain 17,445/15,787 bytes.
- Chrome 157.0.8103.79 passed all 39 final QR browser scenarios. These include
  192px/240px codes with L/M/Q/H correction, short links, the repository URL,
  Arabic/emoji content and single-character content at integer/fractional
  positions. They also check 2x pixel density, rotations of -25/25/90 degrees,
  grid continuity, unclipped outer dots, finder separators, separated/plain
  margins, all supported module/finder combinations, dark RTL, custom renderers,
  gradients/logos, motion policies, replay, forced colors and SVG downloads.
  PNG and SVG exports were read with jsQR; the tests assert the original payload.
- Production docs passed at 1440x1000 light/LTR/system motion/1x density,
  720x1000 dark/LTR/no motion/2x density, 320x1000 light/LTR/system motion/1x
  density and 390x1000 dark/RTL/reduced motion/2x density. Each profile decoded
  the plain circular code, gradient/logo combination, scan preset, downloaded SVG
  and changed Arabic content. Scoped Axe WCAG A/AA checks reported no violations;
  pages reported no runtime errors or horizontal document overflow. Screenshots
  were visually inspected, including the narrow controls and dark circular paper.

Evidence is in `.preview/circular-qr-typecheck.log`, `circular-qr-all-tests.log`,
`circular-qr-lint.log`, `circular-qr-build.log`, `circular-qr-package.log`,
`circular-qr-format-check.log`, `circular-qr-pack.json` and
`circular-qr-changesets.log` under `.preview/`. Browser evidence is in
`.preview/circular-qr-verified-browser.log` and its report. Production results and
screenshots are in `.preview/circular-qr/production.json` and the same directory.
The reference informed the visual direction; its implementation was not inspected.
Physical camera readers, print output, Safari, screen readers and remote CI were
not verified here.
