# Interaction and collection refinements

Date: 2026-11-20. These are integrated changes for the next minor release of
`@plain/ui`; the local manifest remains `0.2.0`. The Changeset records the pending
minor bump. No registry publication or website deployment is implied.

## Consumer behavior

- Shared duration tokens are 160/260/360/520ms. Tabs, SegmentedControl and
  BottomNavigation animate one measured active indicator with CSS. Measurements
  run on selection, font or layout changes, without React updates on animation
  frames. Reduced/none policies and device preferences suppress travel.
- Sidebar keeps leading icons anchored while its width changes and labels fade.
  Expanded header/footer compositions remain mounted but inert when collapsed.
  NavigationRail adds a persistent workspace column beside Sidebar. The existing
  SidebarRail remains the collapse-edge button.
- Sheet/Drawer default to handle-only dragging. Set `handleOnly={false}` for
  deliberate content swipes. Vertical panels provide a handle unless disabled
  or a direct handle is supplied. `maxWidth` centers bounded bottom/top panels;
  detached/floating variants retain the engine's gesture transforms.
- List provides generic records, stable keys, native refs, leading/content/trailing
  renderers, loading/empty states and controlled selection. List and DataTable use
  explicit browse/selection modes. Existing selectable tables retain their old
  initial mode; `selectable defaultMode="browse"` opts into Select/Done controls.
- Table tools, reset, pagination and mode controls can be hidden independently.
  `pagination={false}` displays all loaded pre-pagination rows, not unfetched
  server pages. Filters and sorting use a bottom sheet at 640px and below, or an
  explicit `filterPresentation`. MultiSelect's new summary presentation matches
  Select field height and retains keyboard filtering, accessible selected values
  and repeated native form values.
- Progress accepts allocation segments with stable IDs, labels, values and optional
  colors. Segments take precedence over scalar value. The aggregate remains one
  progressbar; its value text and optional legend describe each allocation.
  Invalid allocations become zero; over-capacity groups scale proportionally.
- Card gains surface/density/selected/interactive options and native `asChild`
  composition. Input, Textarea and NumberInput gain contrast variants. NumberInput
  can hide controls and choose text alignment. Stepper gains compact/dots layouts,
  indicator rendering, density and retained content panels.
- Alert gains appearance/action/dismissal options. Toasts use the current surface
  and a close button by default; `invert closeButton={false}` restores the previous
  presentation. Internal close/notification strings use the translation provider.

The original neutral palette is unchanged. Application records, storage units,
messages and bulk operations live in documentation examples. Feature interfaces
from the supplied local reference and Frappe's collapse behavior informed the API;
their visual styles and color systems were not copied. No engine dependency changed.

## Verification

The implementation was checked from parent `564ddda` in the working tree committed
with this record. Source ownership remains `packages/ui` and `apps/docs`.

- `npm test`: 9 workspace tests, 189 library tests and 6 documentation tests passed.
  The documentation test compiles every playground default, enum choice, boolean
  toggle and numeric boundary as complete TSX. Two earlier timeouts under concurrent
  browser/build load passed in the isolated full run without raising timeouts.
- The final empty-toolbar correction is additionally covered by the collection
  and table-workspace test files. Public documentation controls are recompiled
  after the last example edit.
- Typecheck, ESLint/workspace boundaries, Prettier, the production build and packed
  package verification passed. The final table correction passed 25 focused
  collection/table tests, followed by all 6 documentation compilation tests.
- The package verifier compiles 103 public catalog examples, reads every export,
  checks SSR with React 18.3.1 and 19.3.0, and rejects heavy engines in a Button-only
  import. The verified Button bundle is 19,650 bytes gzip, below the 25kB budget.
  Allocation localization stays tree-shakable with unused Progress exports.

## Browser evidence

Chrome 157.0.8103.79 on Windows, headless Playwright; desktop 1440px, small-phone
320px and normal mobile 390px, with additional existing 1280px scenarios.

- The final production run passed all 47 cases in the core, motion and configuration
  suites. Visual review additionally isolated formatted allocation labels/values
  with native bidirectional markup, preserving English units in RTL legends.
  Both progress geometry/label cases passed again on the rebuilt production
  preview after that markup correction, including the explicit text-direction check.
- The development run exercised 73 cases across the core, workspace and motion
  suites. Its four failures asserted superseded toast defaults or per-icon
  backgrounds. Updated assertions retain text-contrast, native dismissal and
  highlight-geometry coverage; those four cases passed on the production build.
- Eight additional production cases passed for bottom-navigation variants and
  width bounds, Stepper retained form state/layouts, Card variants/density and
  contrast number inputs with hidden controls at 1440px and 320px.
- The motion suite covers progress allocation geometry/labels, List keyboard
  selection, protected slider gestures, centered detached sheets, rapid sidebar
  toggles and anchored icons, menu switching/keyboard traversal, system/reduced/none
  indicators, mobile filter sheets, tool visibility and toast action alignment.
- Existing regressions cover logical-side touch dismissal, snap points, scoped
  RTL portals, remote filtering, sticky scrolling, printing and calendar views.
  A separately labeled read-only example explicitly opts into content swipes;
  the primary settings form uses protected default gestures.
- Axe scans use WCAG A/AA checks for meaningful open/selected states. A targeted
  exclusion covers Radix NavigationMenu's generated hidden focus proxy. Forward
  and backward Tab across that proxy, ArrowDown entry, Escape and focus restoration
  are verified separately. This is not an unrestricted zero-violation claim.

Reproduce browser checks with `PLAYWRIGHT_BASE_URL` pointing at a local development
or production preview and run the four affected files under `apps/docs/tests/e2e`:
`core-upgrade.spec.ts`, `workspace-upgrade.spec.ts`, `motion-refinements.spec.ts`
and `configuration-refinements.spec.ts`. Screenshots and failure traces are emitted
to the ignored `apps/docs/test-results` directory. Curated local screenshots may
be retained under `.preview/interaction-refinements`.

Physical iOS/Android devices, Safari/Firefox, screen readers, literal browser 200%
zoom and remote CI were not verified in this session. Mobile-width reflow, keyboard
navigation and automated scans supplement those checks; they do not replace them.
