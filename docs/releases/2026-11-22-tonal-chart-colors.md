# Tonal chart colors

Validated locally on 2026-11-22, based on `4ea9a40`. This refinement follows the
requested tonal chart reference and replaces the earlier categorical defaults.
A patch Changeset records the change. The package remains 0.2.0; no registry
publication or deployment was performed.

Neutral charts now use eight grayscale shades. Branded chart roles use eight
lightness levels from the active primary palette in each mode, including vibrant
and expressive schemes. They retain the primary hue instead of rotating through
unrelated hues. Other neutral UI roles retain their existing values.

`createColorPalette`, `generateColors` and `useColorPalette` share those roles.
Extended colors vary tone and chroma within the anchor hue family; neutral
extensions remain grayscale. Stable keys, lazy indexing, bounded caching and
contrast fitting remain supported. Grayscale has a finite number of distinct
shades, so an unbounded index API does not imply unlimited unique colors.
Explicit series colors and chart-token overrides still take precedence.

The theming/chart guides and package README describe the revised defaults. The
multi-chart fixture covers automatic bars and donut sectors, generated colors,
scoped brands, neutral dark scopes and explicit custom colors. Its browser checks
wait for Recharts' responsive measurement before checking document overflow.

Multi-chart accessibility checks exposed repeated generic data-table scroll
landmark names. Chart alternatives now pass the chart's data label or custom
tableLabel to Table, so each scroll region has its own accessible name.

Verification:

- Seventy-four focused UI tests passed across palette/theme, chart loading and
  date/chart suites, including the new scroll-region naming regression. Hue and
  contrast checks cover every built-in brand and all three schemes in both modes;
  lazy/distant generation, explicit overrides, neutral UI roles and SSR also pass.
- Eight Chrome 157.0.8103.79 palette checks passed at 1440px light/LTR, 390px
  dark/LTR and 320px light/RTL. Actual SVG colors match scoped CSS roles; default
  and generated palettes follow live theme/mode changes, custom colors remain,
  stable keys stay stable, system mode updates, and the docs theme editor works.
  Axe scans and settled document-overflow checks passed. An additional chart
  regression passed for real area, bar, line and donut rendering, rasterized
  series, keyboard tooltips and accessible data alternatives: nine browser checks.
- Neutral and blue chart captures were visually inspected. The existing 5173
  docs server was separately verified without restarting it. Compiled browser
  checks used an owned 5225 preview.
- TypeScript, ESLint, formatting, workspace boundaries, library/docs builds,
  installed-package verification and Changesets planning passed. The installed
  consumer compiled 108 examples. React 18.3.1/19.3.0 SSR and the React-free pure
  palette entry passed. The pure palette bundle is 17,465 bytes gzip; eager
  Button/Layout budgets remain 19,512/17,776 bytes. The archive has 307 files and
  is 658,103 bytes.

Evidence is under `.preview/tonal-chart-*`. Physical devices, screen readers,
other browser engines, remote CI and the full repository test suite were not run.
