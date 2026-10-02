# Theming and Brand Composition

Use the installed/source exports and types as the API authority. These foundation
APIs are implemented; keep design decisions version-neutral and check the current
types when integration changes an API.

## Theme Settings

`PlainProvider` accepts partial `ThemeSettings`:

```tsx
<PlainProvider
  theme={{
    color: '#2563eb',
    scheme: 'tonal',
    mode: 'system',
    radius: 6,
    density: 'comfortable',
    borders: 'subtle',
    motion: 'system',
    contrast: 0,
  }}
>
  <Button variant="accent">Save</Button>
</PlainProvider>
```

- `color` accepts `null`, `#RGB`, or `#RRGGBB`. An explicit hex color overrides the
  legacy `accent` preset; when color is null, `accent` remains the fallback.
  Neutral defaults are `color: null` and `accent: 'neutral'`; reset both when
  clearing a legacy brand. Those defaults preserve the hand-authored 0.1 colors,
  not a generated Material palette. Generation starts only with a chosen seed
  or colored preset. Check generated foreground, hover, selected, and focus
  colors in both modes.
- `scheme` supports `tonal` (default), `vibrant`, and `expressive`. Contrast defaults
  to `0` and is clamped to `0..1`; it adjusts generation, not an accessibility rating.
- `mode` supports `light`, `dark`, and `system`; borders support `subtle`, `none`,
  and `strong`; motion supports `system`, `reduced`, and `none`.
- Radius is a numeric theme setting; token values are CSS strings. Density supports
  `compact`, `comfortable`, and `spacious`.
- Tokens are a flat map: root keys such as `background`, component aliases such
  as `sidebar.background` and `button.radius`. The mapping is
  `sidebar.background` -> `--ui-sidebar-background`. Style slots such as
  `button.root` select parts; they are distinct from token aliases.
- Neutral palette tones are defined in CSS and `createTheme({ color: null })`.
  Use `control-border` for shared control boundaries; `input.border` inherits it.
  Legacy `input-border` and `input.border` share `--ui-input-border`, so never
  make that alias reference itself. Explicit overrides may restore a border under
  a borderless policy.

## SSR and Local Themes

```tsx
import { createTheme } from '@plain/ui/color-theme';

const brand = createTheme({ color: '#2563eb', scheme: 'tonal', contrast: 0 });
// brand has { color, light, dark, css }.
```

`createTheme` also accepts `tokens` for both modes and `light`/`dark` overrides,
which win over shared tokens. Invalid non-null colors throw. `css` contains light
`:root` declarations and `[data-theme='dark']` overrides. Emit it before paint and
set initial HTML theme/direction to match the application; resolve system mode
from available preferences. Use the color-theme subpath for the server helper.

`ThemeScope` accepts `mode?: 'light' | 'dark'`, `tokens`, `dir`, and
`componentStyles` (the provider calls its slot map `styles`). For a scoped brand,
use the matching generated map, for example `mode="dark" tokens={brand.dark}`.
Check portal inheritance and mixed-direction keyboard behavior.

## Brand Components

Use `extendComponent` or its alias `extend`:

```tsx
const BrandButton = extendComponent(Button, {
  defaults: { variant: 'accent' },
  className: 'brand-button',
  variants: { tone: { brand: 'brand-tone', quiet: 'quiet-tone' } },
  defaultVariants: { tone: 'brand' },
  tokens: { 'button.radius': '12px' },
  styles: { 'button.root': 'brand-button-root' },
});
```

These are ordinary consumer CSS class names, not a required utility framework.
Native props override `defaults`; caller classes merge last and caller `style`
wins over configured token variables. Custom variant props are consumed by the
factory rather than forwarded to the DOM. Tokens style the component root; slot
styles use `StyleProvider`. Preserve refs, names, and handlers when composing it.
Choose custom variant keys such as `tone` that do not shadow control props.

## Apply the Smallest Override

Use provider settings for application-wide appearance, semantic tokens for shared
values, typed slots for component parts, and component props/classes for one-off
instances. Use `ThemeScope` for mixed themes or direction; check that
dialogs, menus, and toasts inherit the intended scope without leaking root styles.
Avoid DOM ancestry selectors or private engine classes when a public slot exists.

Unstyled mode removes defaults, not semantics. Supply layout/positioning, overlay
stacking, hit targets, focus rings, disabled states, contrast, and motion policy.
Keep the same controls and keyboard behavior when replacing their appearance.
