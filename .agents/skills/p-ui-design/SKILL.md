---
name: p-ui-design
description: Design, compose, implement, or review P.UI interfaces and components in this repository, including blocks, templates, responsive web apps, themes, and accessibility. Use for UI work; release-only or backend-only tasks do not require it.
---

# P.UI Design

Make the user's real workflow usable from the first screen. Inspect the current
exports, prop types, styling slots, and neighboring examples before choosing a
component. Use P.UI as the product name and @plain/ui as the package;
historical @plainui/react examples require migration review.

## Library Contract

- Keep styled defaults neutral and usable out of the box. Consumers should not
  need Tailwind, a downloaded font, or a particular app framework. A brand color
  is a deliberate application choice, not a forced library default.
- Preserve the hand-authored 0.1 neutral light/dark colors when no vibe color is
  selected. Material palette generation is opt-in, never the default identity.
- Use H1-H6, P, A, Small, Strong, Em, Code, Pre, Blockquote, Ul, Ol and Li when
  shared typography is useful. Their semantic tag does not change with visual size.
- Blocks/templates are copy/paste documentation examples. Include their own source,
  local state and styles; never import a block, template or registry from @plain/ui.
- Preserve native props, refs, form participation, ARIA, and consumer handlers on
  the actual control. Set button types intentionally; attach field labels and
  errors to the focusable control rather than a non-DOM compound root.
- Customize through typed slots and semantic tokens before adding global CSS.
  Use theme scopes for local brands and direction; verify scoped portals. Unstyled
  composition retains primitive behavior but needs complete visual affordances.
  Read [theming.md](references/theming.md) for theme or brand extension work.
- Retain documented engine compatibility pins. When changing an engine, verify
  Node/SSR imports alongside browser behavior using the repository's lockfile.

## Design Decisions

- Shape screens around tasks and content: a comparison table, editable list,
  master/detail workspace, timeline, or booking calendar often fits better than
  repeated cards. Use cards for repeated independent objects or framed tools;
  use unframed sections for page structure. Build an actual application unless a
  landing page was requested.
- Use an 8px spacing rhythm with 4px optical adjustments. Keep ordinary card
  corners at 8px or below unless the product's brand requires otherwise. Use a
  compact type hierarchy, readable line height, and tabular numbers for metrics;
  keep letter spacing at zero and avoid viewport-scaled font sizes.
- Use icons for tools, swatches for colors, segmented controls for modes, toggles
  for binary settings, inputs or sliders for quantities, and menus for option
  sets. Use Lucide where appropriate; name icon-only controls and give unfamiliar
  actions tooltips. Prefer visible labels on primary commands.
- Keep navigation predictable between list, detail, edit, and return states.
  Mobile web apps need reachable primary navigation, safe-area spacing, usable
  touch targets, and overlays that survive the software keyboard. These are React
  DOM interfaces, not React Native controls.
- Use logical CSS properties and direction context. Mirror directional meaning,
  not every icon or data visualization. Preserve keyboard order, visible focus,
  focus restoration, and accessible overlay names in LTR and RTL.
- Motion should explain a state transition. Respect system/reduced/none policy;
  system follows the device preference and both reduced/none disable the optional
  Motion wrapper's animation. Keep feedback and functionality intact. Avoid
  decorative looping motion or content hidden until animation.

Read [composition.md](references/composition.md) when choosing navigation,
overlays, charts, date/time controls, or virtual layouts. Use established engines
for domain logic; do not manually recreate chart navigation, calendar arithmetic,
or virtualization.

## Verification

Exercise the primary task plus loading, empty, error, disabled, and long-content
states. Use [qa.md](references/qa.md) for browser and interaction checks. Match QA
to the changed behavior and report what was actually run, including remaining
integration or assistive-technology work. A screenshot or automated accessibility
scan alone does not establish complete accessibility.
