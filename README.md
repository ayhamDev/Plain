# PlainUI

A neutral React component library for prototypes, MVPs, and the products they become. Finished defaults; native props; shared tokens; named styling slots; unstyled composition; and right-to-left support.

This workspace includes the reusable `@plainui/react` package and its live documentation website. Version 0.1.0 is a local release, not an npm publication.

## Development

Requires Node 22.12+ and npm. On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.

```sh
npm install
npm run dev
```

Vite prints the local preview URL. Default: http://127.0.0.1:5173. Documentation routes include `/components`, `/components/button`, `/docs/customization`, `/docs/rtl`, and `/examples`.

```sh
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm run verify:package
```

Browser tests use installed Google Chrome locally, and Playwright Chromium on CI. The test suite checks all 44 component pages, keyboard workflows, theme persistence, downloads, mobile layouts, RTL, and automated accessibility. Automated checks do not establish complete WCAG conformance; assistive-technology testing of the final application remains necessary.

## Install a Local Build

```sh
npm pack
# In your consuming React project:
npm install /path/to/plainui-react-0.1.0.tgz
```

React and React DOM 18.3 or 19 are peer dependencies. The package exports ESM modules and TypeScript declarations. Library dependencies are externalized; unused exports can be removed by your bundler. CSS is opt-in, and consuming projects do not need Tailwind to use the compiled defaults.

```tsx
import { PlainProvider, Button, Field, Input } from '@plainui/react';
import '@plainui/react/styles.css';

export function App() {
  return (
    <PlainProvider>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          console.log(form.get('project'));
        }}
      >
        <Field label="Project name">
          <Input name="project" required />
        </Field>
        <Button type="submit">Create project</Button>
      </form>
    </PlainProvider>
  );
}
```

## Customization

Native `className`, `style`, event handlers, ARIA attributes, and refs are supported on controls. Tailwind classes merge predictably. Shared tokens are prefixed with `--ui-`; styling selectors use `data-ui` and `data-slot`.

Buttons expose `data-variant` and `data-size`; badges expose `data-variant`. State-aware primitives retain Radix's `data-state`, `data-disabled`, and related attributes, so product CSS can target exactly the variant or state it owns:

```css
[data-ui='button'][data-variant='primary'] {
  background: var(--ui-accent);
  color: var(--ui-accent-foreground);
  border-color: var(--ui-accent);
}
```

```tsx
<PlainProvider
  dir="rtl"
  theme={{ mode: 'system', accent: 'neutral', radius: 6 }}
  tokens={{
    accent: '#1d4ed8',
    'accent-foreground': '#ffffff',
    'accent-soft': '#eff6ff',
  }}
  styles={{
    'button.root': 'rounded-full font-semibold',
    'input.root': 'rounded-lg',
    'dialog.content': 'max-w-xl',
  }}
>
  <App />
</PlainProvider>
```

`styles` is typed against the exported `StyleSlot` union. Every component page lists its styling slots. Local component classes override provider classes. Use `StyleProvider` for local class overrides and `ThemeScope` for scoped CSS variables and direction; scoped portals retain their theme.

```tsx
<ThemeScope dir="rtl" tokens={{ radius: '12px' }}>
  <Button variant="accent">Create project</Button>
</ThemeScope>

<Button unstyled className="my-button">Your CSS</Button>

<StyleProvider unstyled>
  <YourComposedDialog />
</StyleProvider>
```

For a completely custom stylesheet, omit `styles.css` and author your own rules. `tokens.css` is separately available. Unstyled mode removes PlainUI classes, not primitive semantics or behavior. You must supply positioning, focus styling, and usable targets. DayPicker and Sonner additionally expose their native customization APIs.

## Direction and Appearance

`PlainProvider` sets document direction and Radix direction context without inserting a layout element. Use one provider at the application root. `ThemeScope` supports mixed-direction sections. Layout uses logical spacing, while tabs, radio groups, sliders, calendars, and menus receive the reading direction. Sheets accept logical `start` and `end`, physical `left` and `right`, or `bottom`.

Default settings: system appearance, a neutral accent, 6px corners, and 40px standard controls. Density options are compact (32px), comfortable (40px), and spacious (48px). Explicit sizes remain fixed. `useTheme` exposes theme values, `setTheme`, and `resetTheme`. Local preferences synchronize across tabs; set `persist={false}` to disable storage.

With server rendering, set initial HTML direction and theme attributes to match your application. A client provider hydrates preferences after mount. ESM modules retain client directives for Next.js; import the stylesheet in your root layout.

Arbitrary color overrides are not automatically contrast-validated. Check both light and dark themes and preserve visible focus indicators. The documentation uses a locally served Inter font; the library does not download a font or depend on that asset.

## Components

| Category   | Components                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| Actions    | Button, Toggle, Toggle group, Command, Keyboard key                                                                |
| Forms      | Input, Textarea, Label, Form field, Checkbox, Radio group, Switch, Select, Combobox, Slider, Calendar, Date picker |
| Navigation | Tabs, Breadcrumb, Pagination, Navigation menu                                                                      |
| Feedback   | Badge, Alert, Toast, Avatar, Progress, Skeleton, Spinner, Empty state                                              |
| Overlays   | Dialog, Alert dialog, Sheet, Drawer, Dropdown menu, Popover, Tooltip                                               |
| Layout     | Card, Accordion, Table, Data table, Separator, Scroll area, Collapsible, Aspect ratio                              |

Compound parts are exported individually. Interactive components use Radix; Command uses cmdk; Calendar uses React DayPicker; Toast uses Sonner; DataTable uses the current TanStack Table v9 API. Native controls work with HTML form submission and validation. `Field` requires a single control that accepts `id` and ARIA attributes; wrap `SelectTrigger` inside Field, not Select's non-DOM root.

The DataTable offers client-side search, sorting, pagination, and loading/empty states. Use TanStack directly for server pagination, virtualization, row selection, or larger datasets. Drawer is a bottom-positioned dialog and does not implement drag/swipe gestures. These are React DOM components for responsive web apps and PWAs, not React Native.

## Build Outputs

`npm run build` produces `dist/` for the library and `site-dist/` for the website. `npm pack` runs the library build and creates the installable archive. Nothing is published or deployed automatically.

Built with React, TypeScript, Tailwind CSS v4, Vite, Radix, and Lucide. The lockfile records the tested versions. Tests include semantic and focus contracts, SSR rendering, scoped portal inheritance, RTL interactions, theme validation, and actual data operations.

## License

MIT. See [LICENSE](LICENSE).
