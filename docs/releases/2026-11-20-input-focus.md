# Consistent field focus borders

Integrated after `e45ca96`, with a pending patch Changeset for `@plain/ui`.
The manifest remains the local 0.2.0 candidate; no npm publication is implied.

Input, Textarea and SelectTrigger previously recolored their border with the
focus color in addition to drawing an outer outline. This made their boundary
look heavier than composite fields such as NumberInput. The shared focus border
utility is removed; the existing 2px outline, offset and theme colors are retained.
Resting border widths, variants and invalid states remain intact. There are no
public API, DOM, token, slot, dependency or workspace boundary changes.

Validation:

- TypeScript, ESLint/workspace boundaries, formatting, library/docs build,
  package verification and the npm pack dry run passed.
- All 234 tests passed: 9 workspace checks, 219 library tests and 6 documentation
  tests, including native composition, unstyled behavior and theme contracts.
- Six focused Playwright cases passed in Chrome 157.0.8103.79. They compare
  border colors, widths and shadows before/after keyboard focus, and verify the
  2px outer outline with a 2px offset. Coverage includes all four Input and
  Textarea variants, SelectTrigger, NumberInput, error/read-only/disabled fields,
  local border/focus tokens, native form values, select focus restoration and
  numeric keyboard stepping. Profiles are 1440px light/LTR, 320px light/LTR and
  390px dark/RTL. Separate cases verify theme-borderless fields in both modes and
  forced colors. Axe WCAG A/AA scans passed in the three main fixture states.
- Twelve production scenarios passed across the actual Input, Textarea, Select
  and NumberInput documentation examples at those same three profiles. Default
  borders stayed 1px with the same color and no shadow before/after focus; field
  dimensions stayed fixed. The outer outline remained visible. Native editing,
  numeric stepping and select focus restoration passed, with no document overflow,
  page errors or detected Axe WCAG A/AA violations. Screenshots were inspected.
- The verified archive contains 225 files and is 486,045 bytes. All 103 public
  examples compile, CSS/subpath exports pass, SSR passes with React 18.3.1 and
  19.3.0, and the Button-only bundle remains 20,040 bytes gzip within its 25kB
  budget with heavy features excluded. The docs download archive was refreshed.

Local evidence is in ignored `.preview/input-focus-qa/production.json` and
screenshots, `.preview/input-focus-*.log`, and `apps/docs/test-results/`.
Physical devices, other browser engines, actual browser zoom and screen-reader
sessions were not tested. Mobile viewport checks do not establish physical device
or assistive-technology coverage.
