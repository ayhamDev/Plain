# Theme color palette utilities

Validated locally on 2026-11-21, based on `440ef79`. A minor Changeset records
the compatible palette APIs. The package remains 0.2.0; no registry publication
or deployment was performed.

`createColorPalette` and `generateColors` are available from the core and the
React-free `@plain/ui/color-palette` entry. A palette exposes `get(index)`,
`take(count, start?)`, `forKey(string | number)` and lazy iteration. Colors are
deterministic opaque hex values. Indexed access does not allocate earlier colors;
the extension cache is bounded to 256 entries. Adding records or changing request
order does not reassign an existing index/key.

The first eight colors use the existing theme chart roles, subject to the contrast
target. Further colors vary HCT hue/chroma/tone around those anchors rather than
cycling the eight roles. Seed, scheme, light/dark mode, token overrides, background
and minimum contrast are configurable. Default contrast is 3 against the theme
surface; 1 preserves exact custom colors. Unattainable targets throw. Colors and
backgrounds must resolve to opaque hex; supplied P.UI variable references and hex
fallbacks are supported. External variables/CSS expressions need resolved values.
Indices/counts are nonnegative safe integers. Finite RGB space and perceptual
similarity prevent unlimited unique or distinguishable colors.

`useColorPalette` is exported from the core and styling entries. It follows
PlainProvider/ThemeProvider settings, system-mode changes and nested ThemeScope
modes/tokens without reading computed DOM styles. Explicit scoped modes follow
the existing CSS behavior: a scoped mode starts from that mode's neutral roles;
a scoped brand supplies its generated token map. Explicit hook seed options replace
inherited colors. Existing neutral roles, chart defaults and global UI styling are
preserved. Shared provider override context also supports standalone ThemeProvider.

The theming guide includes a live swatch demo and typed usage examples, linked
from the charts guide. Hex labels are isolated for RTL reading.

Validation:

- Twenty-two new palette/existing theme checks and 61 component/date/chart
  regressions passed: 83 UI tests total. Coverage includes deterministic 1,024-color
  batches, random access at distant indices, hue/chroma/tone bounds, contrast,
  invalid input, variable resolution, stable keys, iteration, memoization,
  nested scopes, explicit overrides and SSR. All six documentation tests passed.
- Six headless Chrome browser scenarios passed against compiled code at 1440px
  light/LTR, 390px dark/LTR and 320px light/RTL. Computed swatches match the actual
  CSS chart roles, all 16 assigned chart series appear in real SVG bars, and scoped
  palettes stay independent during live root changes. Batch extension and reorder
  keep assignments, and a changed system preference updates an existing palette.
  The docs demo expands correctly. Axe scans and document overflow checks passed.
  Desktop and narrow RTL captures were visually inspected; RTL label isolation
  was added and the six scenarios passed again.
- TypeScript, ESLint, workspace boundaries, formatting, library/docs builds,
  Changesets planning, package dry-run and diff checks passed.
- Installed-package verification compiled 107 component examples plus the
  consumer fixture. React 18.3.1 and 19.3.0 SSR produced the expected provider
  colors. The pure entry's bundle excludes React, React DOM, chart, Motion,
  virtualization and Radix engines and is 17,507 bytes gzip. Existing eager
  Button/Layout bundles remain 19,512/17,776 bytes with heavy-feature exclusions.
  The refreshed archive contains 303 files and is 645,269 bytes.

Private evidence is under `.preview/color-palette-*`. The full repository suite
was not repeated; checks target the palette API and changed provider integration.
Browser checks used Chrome 157.0.8103.79. Physical devices, screen readers, other
browser engines and remote CI were not tested. The existing 5173 server was kept;
compiled browser checks used a private 5223 preview.
