# Animated and customizable QR codes

Integrated after `a3eee59`, with a pending minor Changeset for `@plain/ui`.
The local package remains 0.2.0; no npm publication or deployment is implied.
Validation date: 2026-11-21.

QRCode now reveals once on mount and content changes by default. Consumers can
choose reveal/fade, duration, delay or no animation. The animation follows the
existing motion scale/easing and provider/system reduced-motion settings.
Rendering uses aggregated SVG paths and memoized encoding/geometry; individual
module nodes are created only for an explicit custom renderer.

Customization includes module shapes/scaling, separate finder frame/center
shapes and colors, linear/radial gradients, center logos, encoder version/mask
options and advanced module/finder SVG render hooks. Circular presentation
preserves the entire encoded square and four-module quiet zone inside a round
background with optional decorative outer modules. Logos preserve reserved light
and dark function cells and default to H correction when no level is supplied.
Native SVG props/refs/ARIA, empty/error feedback, localization, scoped tokens and
unstyled rendering retain their contracts. No dependency was added.

The documentation playground exposes styles, ink color, logo, gradient,
animation/replay and an application-owned static SVG download. Downloaded
gradients, masks and embedded logos remain self-contained. API tables, package
README, typed slots and timing tokens document the customization options.

Validation:

- All 356 workspace tests passed: 9 infrastructure checks, 341 library tests
  (including 19 QR tests) and 6 docs tests. Workspace TypeScript, ESLint,
  dependency boundaries, formatting, Changesets status, builds and package
  contents passed.
- Installed-package verification compiled 106 public examples and the expanded
  modular QR consumer. React 18.3.1 and 19.3.0 server rendering passed for plain
  and circular/gradient/logo QR codes. The archive contains 253 files and is
  563,922 bytes. Button and layout gzip sizes remain 17,445 and 15,787 bytes.
- Chrome 157.0.8103.79 passed all 19 targeted browser tests. Decoder checks cover
  24 square/circular module/finder combinations, a 192px circular logo/gradient
  code, radial gradients, logo/version-7 alignment patterns, custom rendering,
  module scaling, all correction levels and Unicode. Animated value changes,
  live reduced-motion changes, explicit opt-out and provider policies passed.
  A background-color assertion was updated to target its slot after the reveal
  mask added another SVG rect; that case passed on its focused rerun.
- Production playground checks passed at 1440x1000 light/LTR, 720x1000 dark/LTR,
  320x1000 light/LTR and 390x1000 dark/RTL. Each profile decoded all four styles,
  a circular logo/gradient code, updated content and a downloaded standalone
  SVG. Keyboard selection/focus restoration, motion settings, empty recovery,
  scoped Axe WCAG A/AA checks and horizontal overflow checks passed. No page
  errors were observed. Desktop and phone screenshots were visually inspected.

Evidence is in `.preview/qr-custom-report`, `.preview/qr-custom-token-report`,
`.preview/qr-custom-qa` and logs with the `.preview/qr-custom-` prefix. Production
results are in `.preview/qr-custom-qa/production.json`. Scanning checks use jsQR
on Chrome-rendered pixels and exported SVGs. Physical cameras, Safari, screen
readers and remote CI were not verified in this local pass. Custom colors,
logos and renderers still require scanning checks at the application's actual
display/print size.
