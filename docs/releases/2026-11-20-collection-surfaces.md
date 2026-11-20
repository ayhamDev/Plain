# List selection and mobile table sheets

Integrated after `0c63252`, with a pending patch Changeset for `@plain/ui`.
The manifest remains the local 0.2.0 candidate; this work does not publish to npm.

## Behavior

List selection now uses the checkbox without a persistent selected-row background.
Enabled rows share the normal hover treatment in browse and selection modes on
devices that support hover. Touch selection does not leave a synthetic hover fill.
Selection callbacks, bulk actions, native checkbox semantics, `data-selected`,
render state and styling slots remain available for application customization.
Disabled item text remains readable, with disabled selection communicated through
the checkbox. Long row content, metadata and action labels stay within the list.

Mobile table sheets use one scrolling content area and keep Done outside that
area. Sort columns can shrink, narrow layouts place labels above their controls,
and content has room for focus outlines. The sheet root no longer adds a second
scrollbar. Unstyled composition avoids imposing the default mobile panel classes.
The default palette and component APIs are unchanged.

## Verification

- ESLint/workspace boundaries, TypeScript and the production build passed.
- The full unit run passed 200 library, 6 documentation and 9 workspace tests.
- Package verification compiled all 103 catalog examples, checked public exports
  and CSS, and exercised SSR with React 18.3.1 and 19.3.0. A Button-only consumer
  remained at 19,985 bytes gzip, within the 25kB budget, with heavy engines excluded.
  The documentation's downloadable archive was regenerated from this candidate.
- Chrome 157.0.8103.79 / Playwright passed 11 development scenarios: checkbox-only
  List selection and ordinary hover at 1000px LTR/light, 320px LTR/light and 390px
  RTL/dark; disabled rows; bulk clear; long content bounds; touch selection;
  unstyled sorting; and 12-rule sort sheets at 320px, 390px and 640px. The count
  includes the existing List desktop/mobile and mobile filter regressions.
- The sort cases changed direction through the native Select, checked horizontal
  bounds, scrolled long content, reached Done and restored focus to the trigger.
  Axe A/AA scans passed for the List fixture states and mobile filter workflow.
- One additional production preview case passed against the compiled package:
  keyboard List selection without row fill, then a Customer sort direction change
  in the mobile sheet, no horizontal overflow, Done visibility, focus restoration
  and an Axe A/AA scan. Its List and sheet screenshots were visually inspected,
  alongside the development desktop and narrow stress cases.
- These are targeted Chrome checks. Other browser engines, physical touch devices
  and screen readers were not exercised in this task.

Fixtures are `apps/docs/tests/fixtures/collection-surfaces.*`; browser cases are in
`apps/docs/tests/e2e/collection-surfaces.spec.ts`. Screenshots are generated in the
ignored Playwright output directory. Run the fixture cases against development;
the built-preview case also works against the production preview:

```sh
npm run test:e2e -- collection-surfaces.spec.ts --grep-invert "built collection previews"
npm run test:e2e -- collection-surfaces.spec.ts --grep "built collection previews"
```
