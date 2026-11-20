# Section tab layouts

Integrated after `fb4cc31`, with a pending minor Changeset for `@plain/ui`.
The manifest remains a local 0.2.0 candidate; no registry publication is implied.

## Behavior and compatibility

TabsList extends the existing underline presentation with `fullWidth`, `scrollable`,
`size` and `indicatorThickness`. A full-width baseline with a 1px underline and
natural label widths provides the reference section-bar layout. Segmented,
intrinsic-width, non-scrolling medium tabs remain the component defaults.

Scrollable lists reveal initial, controlled and keyboard selection within their
own viewport. Layout changes recheck the selected tab; manual list scrolling
does not snap back. Revealing selection only scrolls the list, including when
`animated={false}`. Keyboard focus remains visible inside clipped list boundaries.
Vertical overflow requires a bounded list height; horizontal overflow requires a
bounded parent width. The component keeps Radix semantics and disabled-tab handling.

The shared indicator hook still measures on selection/layout/scroll events using
bounded animation frames. CSS owns transitions, with no React renders per animation
frame. Reveal behavior is opt-in for TabsList; other indicator consumers keep their
existing behavior. Native props, refs, styling slots, unstyled composition, RTL and
motion policies remain available.

Theme aliases `tabs.border`, `tabs.indicator-color` and `tabs.indicator-thickness`
use existing semantic tokens. No palette, dependency or translation dictionary
changed. The docs demonstrate the requested record sections and expose size,
layout, scrolling, thickness and animation controls with matching copyable source.

## Verification

- ESLint/workspace boundaries, TypeScript, Prettier and production build passed.
- The full unit run passed 198 library, 6 documentation and 9 workspace tests.
  New coverage checks native refs, controlled/manual activation, disabled tabs,
  compatible defaults, consumer style overrides and inherited unstyled behavior.
  Documentation tests compile every playground default, option and boundary.
- Package verification compiled 103 catalog examples, checked exports and SSR
  with React 18.3.1 and 19.3.0, and excluded heavy engines from the Button-only
  consumer. That bundle measured 19,957 bytes gzip within the 25kB budget.
- Chrome 157.0.8103.79 / Playwright passed 13 development checks: six section-tab
  cases, six existing shared-highlight cases and the RTL tabs/sheet regression.
  Coverage includes 320/390/800/1000px viewports, light/dark, LTR/RTL, overflow,
  resizing, indicator alignment, controlled selection outside the viewport,
  manual scrolling, disabled tabs, manual activation, vertical overflow and
  system/reduced/none motion. Axe scans of the fixture states passed A/AA checks.
- The production docs check passed the nine-section reference bar, 1px underline,
  full-width layout, sizing, static-indicator option and matching copyable source.
  Narrow light/dark RTL screenshots and the production reference were visually
  inspected. Automated scans are not assistive-technology certification; physical
  devices, screen readers and other browser engines were not exercised.

Fixtures are `apps/docs/tests/fixtures/section-tabs.*`. Browser checks are in
`apps/docs/tests/e2e/section-tabs.spec.ts`; generated screenshots live in ignored
Playwright output directories. Run fixtures against the development server and
the docs-only case against either development or production:

```sh
npm run test:e2e -- section-tabs.spec.ts
npm run test:e2e -- section-tabs.spec.ts --grep "docs expose"
```
