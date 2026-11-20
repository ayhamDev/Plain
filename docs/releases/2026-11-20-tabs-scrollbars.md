# Clean tab underlines and visible scrollbars

Integrated after `3cf22ad`, with a pending patch Changeset for `@plain/ui`.
The manifest remains the local 0.2.0 candidate; no npm publication is implied.

Underline tabs now paint a thin bar rather than an inset shadow across a
full-height rectangle. This removes side artifacts during fractional movement.
The static `animated={false}` fallback uses a bottom pseudo-element with the same
color and thickness. Mouse activation does not add a focus outline; keyboard
focus retains the existing visible inset ring. Segmented tab styling is retained.

`scrollable` tab lists show a contrasting native scrollbar when content overflows.
Compatible WebKit scrollbar styling uses a 12px track with an 8px painted thumb;
standard scrollbar properties provide the fallback in other engines. Native drag,
horizontal wheel/trackpad input, Shift-wheel, selection reveal and manual list
scrolling retain native behavior. `tabs.scrollbar-size`, `tabs.scrollbar-thumb`
and `tabs.scrollbar-track` configure the appearance; defaults derive from existing
neutral semantic colors. Existing palettes and other scrollbar defaults are retained.
Forced colors use Canvas/CanvasText for the underline and scrollbar.

Validation:

- TypeScript, ESLint/workspace boundaries, formatting, library/docs build and
  package verification passed. Final browser-test geometry expressions also
  passed focused ESLint and formatting checks.
- All 234 tests passed: 9 workspace checks, 219 library tests and 6 documentation
  tests, including native tab refs, disabled/manual/controlled activation, style
  overrides and unstyled composition.
- Eighteen focused Playwright cases passed in Chrome 157.0.8103.79: twelve tab
  layout/scrollbar cases and six shared Tabs/SegmentedControl motion regressions.
  Coverage includes 320/390/800/1000px, light/dark, LTR/RTL, resize, offscreen
  controlled selection, vertical overflow, keyboard focus, reduced/none motion,
  static fallback, clean pixels above tab labels, real native thumb dragging,
  horizontal wheel and Shift-wheel, local token overrides and forced colors.
  The three scrollbar geometry cases were rechecked after their type correction.
  Default thumb/track contrast exceeded 3:1 before hover in both themes. Existing
  Axe scans of the tested tab states passed WCAG A/AA checks.
- Package validation passed: 225 files in the 485,713-byte archive, 103 compiled
  public examples, exported CSS/subpaths, and SSR with React 18.3.1 and 19.3.0.
  The Button-only bundle is 20,040 bytes gzip within its 25kB budget, with heavy
  features excluded. The downloadable archive was refreshed.
- Five production-page scenarios passed: 1440px light/LTR, 1000px light/LTR at
  1.25 device scale, 800px dark/RTL, 320px light/LTR and 390px dark/RTL. Every
  underline measured 1px without a box shadow. The fitting 1440px layout retained
  no scrollbar gutter; all four overflowing layouts showed a 12px track and
  successfully dragged within their actual scroll range. Selection stayed put
  during dragging, Home restored keyboard focus, and there were no page errors,
  document overflow or detected Axe WCAG A/AA violations in the tested states.
  Screenshots were inspected.

Native scrollbar tests remove Playwright's `--hide-scrollbars` default so the real
track is rendered and receives pointer input. Chromium's standard scrollbar-color
override is disabled only when the WebKit pseudo-elements are supported, allowing
the explicit track size to apply; see the [MDN scrollbar reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::-webkit-scrollbar).

Local evidence is in ignored `.preview/tabs-scrollbar-qa/`, including
`production.json`; logs use `.preview/tabs-scrollbar-*.log`. Fixture captures are
under `apps/docs/test-results/`. Other browser engines, physical devices, actual
browser zoom and screen-reader sessions were not tested. Device-scale emulation
does not establish physical display or assistive-technology coverage.
