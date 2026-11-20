# Animated edge handles

Integrated after `d27d163`, with a pending minor Changeset for `@plain/ui`.
The manifest remains a local 0.2.0 candidate; no registry publication is implied.

## Behavior and migration

ResizableHandle and SidebarRail now share a CSS edge highlight. It fades and grows
on hover, fades and shrinks on exit, appears for keyboard focus and stays visible
while a separator is actively dragged. The effect uses absolute decoration, so
hover does not change panel sizes or hit-target geometry. Logical placement follows
both sidebar sides in LTR and RTL. Devices without hover keep a visible affordance.

ResizableHandle's `withHandle` default changes from true to false. Set
`withHandle={true}` to retain the former grip pill; custom children still replace
the grip. The edge-only separator has an explicit 1px layout size on either axis,
avoiding the zero-sized native element exposed when its intrinsic grip is removed.
Group pointer targets remain 12px for fine pointers and 32px for coarse pointers.

Native refs, keyboard resizing, consumer handlers, sidebar collapse, styling slots
and unstyled behavior remain available. SidebarRail is still a collapse control;
it shares the resize handle's appearance without acquiring resize behavior.
Transitions follow system/provider reduced/none motion. Forced colors use system
colors rather than disappearing into the background.

Theme aliases `edge-handle.color`, `edge-handle.thickness`, `edge-handle.duration`
and `edge-handle.ease` customize the shared treatment. No palette, dependency or
translation dictionary changed. The docs expose `withHandle` with matching source.

## Verification

- ESLint/workspace boundaries, TypeScript, Prettier and production build passed.
- The full unit run passed 200 library, 6 documentation and 9 workspace tests.
  New checks cover the edge default, grip opt-in, custom children, native refs,
  consumer cancellation, sidebar collapse and inherited unstyled composition.
  The documentation contract typechecked every playground option and boundary.
- Package verification compiled 103 catalog examples, read public exports and
  checked SSR with React 18.3.1 and 19.3.0. Heavy engines remain excluded from a
  Button-only consumer, measuring 19,985 bytes gzip within the 25kB budget.
- Chrome 157.0.8103.79 / Playwright passed 13 development scenarios: four sidebar
  side/direction combinations, both resize axes, reduced/none motion and forced
  colors, disabled separators, grip source, no-hover emulation, both prior keyboard
  resize profiles and both sidebar collapse regressions. Animation frame samples
  contained intermediate opacity during entry and exit, with stable geometry.
  Dragging and keyboard resizing passed at desktop and narrow widths; Axe scans
  of the meaningful fixture states passed A/AA checks.
- The first pointer pass exposed a zero-sized edge-only separator. After giving
  both orientations an explicit hairline size, all affected pointer checks and
  the regression cases passed. The built documentation check also passed both
  preview hovers and matching colors; both screenshots were visually inspected.
- Emulated checks do not establish physical-device or screen-reader coverage.
  Other browser engines and assistive technology were not exercised in this task.

Fixtures are `apps/docs/tests/fixtures/edge-handles.*`. Browser cases are in
`apps/docs/tests/e2e/edge-handles.spec.ts`; screenshots are generated in ignored
Playwright output directories. Run fixture cases against development, and the
built-preview case against either development or production:

```sh
npm run test:e2e -- edge-handles.spec.ts
npm run test:e2e -- edge-handles.spec.ts --grep "built previews"
```
