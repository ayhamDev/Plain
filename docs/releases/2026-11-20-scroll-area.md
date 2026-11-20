# ScrollArea hover and faded edges

Integrated on 2026-11-20 after `0732343`, with a pending minor Changeset for
`@plain/ui`. The manifest remains a local 0.2.0 candidate; no publication is implied.

## Behavior and API

ScrollArea's overlay thumb widens smoothly on hover and during dragging. Its hit
area stays fixed, so native viewport geometry and Radix drag measurements do not
change. `scrollbarSize`, `scrollbarHoverSize` and `scrollbarExpandOnHover` configure
the behavior. Direct ScrollBar exposes `size`, `hoverSize` and `expandOnHover`.
Size values include the 4px optical gutter; the hit area is at least 12px.

Faded content edges are disabled by default. `fadeEdges={true}` follows the
configured scrolling axes. An options object accepts:

- `edges`: top, bottom, logical start/end, or any combination.
- `size`: fade distance in pixels or a CSS length, default 24px.
- `intensity`: 0..1, default 1; invalid numeric values are normalized.
- `mode`: scroll-aware by default; always preserves selected edges at boundaries.
- `threshold`: scroll boundary tolerance in pixels, default 1.

The mask uses transparency, preserving arbitrary underlying backgrounds. It
affects the viewport only; the frame and scrollbar remain readable. Keyboard-visible
focus and forced colors remove the mask. System/reduced/none motion policies
govern transitions; forced colors use a system color for the thumb.

Scroll-aware mode uses passive events, ResizeObserver and bounded animation-frame
measurements. DOM writes occur only when edge availability changes. It does not
add React state updates on scrolling. Always mode needs no scroll observers.
Native refs, consumer events, unstyled parts and pull-to-refresh behavior remain.

Theme aliases are `scrollbar.width`, `scrollbar.hover-width`,
`scroll-area.fade-size` and `scroll-area.fade-intensity`. No palette or dependency
changed. Documentation includes configuration controls and copyable source.

## Verification

- Typecheck, ESLint/workspace boundaries, Prettier and production build passed.
- The full unit run passed 192 library, 6 documentation and 9 workspace tests.
  The docs test compiles every playground default, option and numeric boundary.
- Package verification passed: 103 catalog examples compiled, all exports read,
  SSR on React 18.3.1 and 19.3.0, and no heavy engines in a Button-only bundle.
  The bundle measured 19,686 bytes gzip against the existing 25kB budget.
- Chrome 157.0.8103.79 / Playwright passed 11 new browser cases plus the existing
  native ScrollArea wheel/keyboard regression, on 1000px and 320px viewports.
  Coverage includes both axes, LTR/RTL, intermediate animated thickness, stable
  viewport/track geometry, pointer dragging, opt-out and custom sizes, resize and
  content updates, selected persistent edges, intensity pixel checks, keyboard
  focus, forced colors, reduced motion and matching documentation source.
- Axe scans of the meaningful fixture states passed WCAG A/AA checks. This is not
  assistive-technology certification. Physical devices, screen readers and other
  browser engines were not exercised in this task.

Reproduce with `PLAYWRIGHT_BASE_URL` pointing at the development preview:

```sh
npm run test:e2e -- scroll-area-effects.spec.ts
```

The browser fixture lives in `apps/docs/tests/fixtures/scroll-area.html` and
`scroll-area.tsx`; it is test application source, not a library export.
Screenshots are generated in ignored `apps/docs/test-results` directories.
