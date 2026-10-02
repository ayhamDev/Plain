# P.UI Changelog

Package history and pending release scope. Released entries describe verified
local builds unless publication is explicitly recorded. Pending scope must be
reconciled with the integrated package before release.

## Unreleased

- Refine opt-in seeded themes with low-chroma elevated surfaces and quieter structural borders;
  keep the original 0.1 neutral defaults and standard Material text/action contrast.
- Generate theme-coordinated categorical chart palettes rather than reusing action/error roles.
  Infer distinct colors for composed series; add unique area gradients, restrained grids,
  and compact configurable tooltip indicators with tabular values. Explicit colors/fills win.

### 0.2.0 Candidate

P.UI is the product name; `@plain/ui` is the package, already assigned version
`0.2.0` during integration. This entry records the integrated local candidate,
not a registry publication. Final validation is recorded in [QA.md](QA.md).
See [migration and review notes](docs/releases/0.2.0.md).

#### Breaking Changes

- Rename `@plainui/react` to `@plain/ui`, including consumer imports and supported
  CSS/subpath imports. Registry names are distinct; no automatic alias is promised.
- Sheet/Drawer now use Vaul. Prefer root `side`: it takes precedence over native
  physical `direction`, then the legacy `SheetContent side` compatibility fallback.
  Logical `start`/`end` resolve using RTL context; Sheet defaults to `end` and Drawer
  to `bottom`. Review gestures, scrolling, and focus in the consuming application.

#### Additions

- Implemented layered theming: hex/null color, tonal/vibrant/expressive schemes,
  contrast `0..1`, mode, radius, density, borders, and motion. Legacy `accent`
  presets remain a fallback when color is null.
- Flat semantic tokens and component dot aliases; `ThemeScope` light/dark mode
  with tokens, direction, and component styles; `createTheme` returning
  `{ color, light, dark, css }`; and `extendComponent`/`extend` for brand components.
- Preserved the original hand-authored 0.1 light/dark neutrals by default;
  Material palette generation requires an explicit seed or colored preset.
  Defined grayscale palette metadata, including in `createTheme({ color: null })`.
  Shared `control-border` feeds `input.border`; legacy `input-border` maps to the
  same CSS variable as that component alias. Default layers are dropdown 100,
  overlay 80, dialog 90, and toast 110, with explicit overrides available.
- Expanded date/time and scheduling experiences using established engines;
  Recharts-backed chart compositions with accessible data alternatives; virtual
  lists/grids for large datasets with deliberate focus and rendering constraints.
- Responsible motion with system, reduced, and none policies, plus mobile-friendly
  sheets and workflow navigation.
- **91 documented component families**, including semantic native **H1-H6, P,
  Span, Small, Strong, Em, A, Code, Pre, Blockquote, Ul, Ol, Li, and Mark**.
- **120 copy/paste blocks in 12 categories** and **60 multi-screen templates in
  5 platform categories**. Complete downloaded TSX includes the implementation,
  sample data, helpers, and editable CSS. Examples are documentation-only, never
  package exports or a runtime block/template registry.
- A repo-local design skill enabled for implicit invocation, contributor guidance,
  and a repeatable Changesets release workflow.

The Material color engine intentionally uses `^0.3.0` for Node 24 ESM/SSR
compatibility; see the release note for the upstream 0.4 import issue. Tailwind
tooling is 4.3.3 and the installed Changesets CLI is 3.0.3.

#### Fixes

- Portalled dropdown submenus no longer expand the parent scroll area and remain
  in the viewport in LTR/RTL, including narrow mobile screens.
- Centered dialog entrance/exit motion, inverse toast defaults without a close
  button, shape-aware switches, visible skeletons, and functional scroll examples.
- Restored the PlainUI content heading while retaining P.UI header branding;
  added a version combobox and contained theme-editor controls/code.
- Source dialogs focus their heading initially and restore the invoking control,
  so a tooltip does not consume the first Escape press.
- React 18 and 19 both retain native `inert` on loading overlays and disabled
  calendars, preventing keyboard interaction with unavailable content.

No publication, remote CI, physical-device testing, or accessibility certification
is claimed. The [0.1 QA archive](docs/releases/0.1.0-qa.md) remains historical;
[QA.md](QA.md) records the actual 0.2 candidate results.

## 0.1.0 - 2026-10-01

Initial **local** release of PlainUI as `@plainui/react`, preserved from the
existing repository documentation and changelog page.

- 44 documented components with live examples; React/TypeScript, modular ESM
  exports, and typed declarations.
- Neutral defaults, opt-in compiled CSS, native props, named styling slots, scoped
  tokens, and unstyled composition.
- Light/dark/system themes, radius and density settings, and direction-aware
  controls and logical RTL layout.
- Dashboard, settings, and authentication examples.

[Archived QA](docs/releases/0.1.0-qa.md) records the original local validation and
its limitations. This version was not an npm publication or hosted deployment.
