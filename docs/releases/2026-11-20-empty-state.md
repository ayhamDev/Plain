# Composable empty states

Integrated after `bfde476`, with a pending minor Changeset for `@plain/ui`.
The package is still the local 0.2.0 candidate; no registry publication is implied.

## API and compatibility

- `actions`, `media` and `footer` accept arbitrary React nodes. There is no action
  count limit or library-owned application schema. Existing `action` remains
  supported; supplying `actions`, including null or false, takes precedence.
- Children still replace the entire shorthand layout. EmptyStateContent can hold
  forms, lists and any application content. EmptyStateMedia and EmptyStateFooter
  add styled parts with native props, refs and typed styling slots.
- Root `variant` supports default, muted and outlined surfaces; `size` supports
  sm, md and lg spacing. Media supports plain/icon variants and rounded/circle/square
  shapes. Actions wrap by default or stack with `layout="column"`, and expose
  logical alignment. Horizontal content wraps when space is constrained.
- Title and Description support `asChild`, allowing the correct heading level and
  rich block descriptions. No live-region or interactive role is forced on the
  empty state. Meaningful media and controls need application-provided labels.
- Explicit null/false icons now hide the fallback icon. Conditional false actions
  and footers do not leave empty wrappers. Default neutral colors, native props,
  styling slots and inherited unstyled behavior remain available. No dependency,
  palette or translation dictionary changed; new content is application-owned.

The documentation has a three-action primary example plus controls for surfaces,
spacing, orientation, media, supporting content, up to five example actions and a
native form. That example count is a playground choice, not a component limit.
Generated TSX includes the state and callbacks needed for its local feedback.

## Verification

- TypeScript, ESLint/workspace boundaries, formatting and production build passed.
- The full unit run passed 196 library, 6 documentation and 9 workspace tests.
  A focused rerun passed all four EmptyState tests after the conditional-content
  refinement. Coverage includes twelve independent actions, disabled actions,
  legacy shorthand, explicit hiding, custom media, rich descriptions, native form
  submission, refs, heading semantics, styling slots and unstyled inheritance.
- The docs source contract typechecked every playground default, enum option,
  toggle and numeric boundary. Package verification compiled all 103 catalog
  examples, checked public exports and SSR with React 18.3.1 and 19.3.0, and
  confirmed a Button-only consumer excludes heavy engines within the 25kB budget.
- Chrome 157.0.8103.79 / Playwright passed four composition scenarios at 320, 390,
  768 and 1440px, covering light/dark, LTR/RTL, wrapping and stacked actions,
  horizontal layouts, custom media, keyboard form submission and real links.
  The existing empty collection navigation check also passed.
- The production documentation check passed multiple actions, optional form
  submission, media removal and matching copyable source. An earlier development
  attempt was interrupted by a build-triggered preview reload; the production
  check ran after building to keep that verification stable.
- Axe scans of the fixture states passed WCAG A/AA checks. Narrow and wide
  screenshots were visually inspected, including long labels and an RTL dark
  form. This is not screen-reader certification; physical devices and other
  browser engines were not exercised.

Fixtures are under `apps/docs/tests/fixtures/empty-state.*`. The browser checks are
in `apps/docs/tests/e2e/empty-state-composition.spec.ts`; screenshots are generated
in ignored Playwright output directories. Run the fixture cases against Vite's
development server, and the docs-only case against either development or production:

```sh
npm run test:e2e -- empty-state-composition.spec.ts
npm run test:e2e -- empty-state-composition.spec.ts --grep "docs demonstrate"
```
