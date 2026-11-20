# Sidebar overflow containment

Integrated after `039fcb7`, with a pending patch Changeset for `@plain/ui`.
The manifest remains the local 0.2.0 candidate; no npm publication is implied.

Both assembled examples reproduced a 64px collapsed SidebarContent with an 81px
scroll width and an unwanted horizontal scrollbar. Hidden group labels still
contributed intrinsic width, and items with hidden badges/actions retained their
44px trailing padding. The fix bounds labels/items, releases collapsed trailing
space and gaps, and adapts compact icon padding to the available width.
SidebarContent and NavigationRail lists contain horizontal overflow while
retaining native vertical scrolling. Sidebar headers/footers no longer shrink
when the menu is long, and their padding accommodates narrower collapsed widths.

The changes use the existing CSS layers and semantic motion values. Public APIs,
DOM structure, slots, native refs/events and mounted input state are retained.
There are no new dependencies or workspace boundaries.

Validation:

- TypeScript, ESLint/workspace boundaries, formatting, library/docs build,
  package verification and the npm pack dry run passed.
- All 234 tests passed: 9 workspace checks, 219 library tests and 6 documentation
  tests, including native composition, styling/unstyled and direction contracts.
- Twelve focused Playwright cases passed in Chrome 157.0.8103.79: ten new
  overflow cases and two existing sidebar collapse motion regressions. The
  actual Sidebar and NavigationRail documentation examples pass in LTR/light
  and RTL/dark. Four long-menu fixtures cover 48px/64px collapsed widths,
  sidebar/inset/floating variants and start/end placement. They check icon
  containment, native vertical scrolling through a forwarded ref, native scroll
  events, focus on the final destination/workspace, reachable footer actions and
  input state after expansion. Two 320px/390px mobile cases cover long-menu
  scrolling, selection, closing and trigger focus restoration with motion disabled.
  Existing motion cases check intermediate widths, anchored icons, independent
  rail width and repeated keyboard toggles.
- Ten production-page scenarios passed across both affected examples:
  1440px light/LTR, 1000px dark/RTL, 800px light/LTR, 320px light/LTR and
  390px dark/RTL. Every desktop collapsed navigation measured 64px client and
  scroll width; mobile navigation measured 272px for both. All measured zero
  horizontal scrollbar gutter, contained visible icons, and produced no document
  overflow or page errors. Desktop expansion and mobile selection/focus restoration
  also passed. Screenshots were inspected.
- Axe WCAG A/AA scans passed for the four tested collapsed development examples,
  six collapsed production examples and the existing expanded NavigationRail
  motion cases. An initial scan of the expanded Sidebar example identified the
  existing 8px SidebarRail toggle's `target-size` issue. That unchanged control is
  outside this overflow fix; the new accessibility scans cover the collapsed state
  addressed here. No accessibility rule was disabled. Mobile automated
  accessibility scans and screen-reader sessions were not performed.
- The verified archive contains 225 files and is 485,962 bytes. All 103 public
  examples compile, CSS/subpath exports pass, SSR passes with React 18.3.1 and
  19.3.0, and the Button-only bundle remains 20,040 bytes gzip within its 25kB
  budget with heavy features excluded. The docs download archive was refreshed.

Native scrollbar checks remove Chrome's `--hide-scrollbars` launch argument.
Local evidence is in ignored `.preview/sidebar-overflow-qa/production.json` and
screenshots, `.preview/sidebar-overflow-*.log`, and `apps/docs/test-results/`.
Other browser engines, physical devices and actual browser zoom were not tested.
