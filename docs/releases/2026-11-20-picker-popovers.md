# Time picker layout and popover placement

Integrated after `6cff12f`, with a pending patch Changeset for `@plain/ui`.
The manifest remains the local 0.2.0 candidate; no npm publication is implied.

## Behavior

Standalone time pickers have a stable preferred width, bounded by the available
screen space. Hour, Minute and optional period/seconds share one grid row rather
than wrapping into a vertical stack. Date-time pickers use the same time layout.
Native wall-time values, constraints, translations, styling slots and focus
restoration are preserved. The docs now show the actual `minuteStep` and
`hourCycle` types/defaults: `5` and `h23`, with `h12` as the other hour cycle.

Shared styled PopoverContent uses Radix's available width and height, with internal
scrolling when its content is taller than the available space. Collision padding
defaults to 8px and sticky positioning to `always`, allowing edge triggers to shift
their popup fully into view. Native placement/collision props, custom boundaries
and consumer class/style sizing overrides remain available. Unstyled composition
continues to leave visual sizing to the consumer.

The positioning engine is unchanged; no custom measurement loop, dependency or
palette was added. Calendar popups inside event dialogs retain their parent dialog
when Done closes the popup and returns focus to the associated input.

## Verification

- ESLint/workspace boundaries, TypeScript, Prettier and the production build passed.
- The full unit run passed 200 library, 6 documentation and 9 workspace tests,
  including native temporal values/constraints, scoped portals and form behavior.
- Package validation compiled all 103 catalog examples, read public exports/CSS
  and exercised SSR with React 18.3.1 and 19.3.0. A Button-only consumer remained
  19,985 bytes gzip, within the 25kB budget, with heavy engines excluded. The docs'
  downloadable archive was regenerated from this candidate.
- Chrome 157.0.8103.79 / Playwright passed 16 development scenarios: inline time
  controls at 320/390/1000px in LTR/RTL; optional AM/PM and seconds; corner placement;
  long popovers from all four edges; a resize to 320x280; custom collision boundaries;
  and nested event-dialog pickers at 1000x600 and 390x600. Existing time, color picker
  and mobile filter regressions also passed. Time changes, nested Select menus,
  horizontal bounds, scroll reachability and focus restoration were exercised.
- Axe A/AA scans passed for the fixture time popups and the existing time/color
  picker and filter workflows. Two additional production-preview cases passed
  against the compiled package, covering inline time ranges and nested event
  calendars in light/LTR and dark/RTL. Production and narrow stress screenshots
  were visually inspected.
- Other browser engines, physical devices and screen readers were not exercised.
  These targeted checks do not establish complete accessibility or universal
  positioning guarantees for application-owned styles and boundaries.

Fixtures are `apps/docs/tests/fixtures/picker-popovers.*`; browser cases are in
`apps/docs/tests/e2e/picker-popovers.spec.ts`. Screenshots are generated in ignored
Playwright output directories. Fixture cases require the development server;
the built-preview cases also work against the production preview:

```sh
npm run test:e2e -- picker-popovers.spec.ts --grep-invert "built picker"
npm run test:e2e -- picker-popovers.spec.ts --grep "built picker"
```
