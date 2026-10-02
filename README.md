# P.UI

Plain by default. Yours by design. `@plain/ui` is a React and TypeScript component library for prototypes, MVPs and the web applications they become.

Version 0.2.0 is a **local release**, not an npm publication. The workspace includes the library, documentation, 120 copy/paste blocks and 60 multi-screen templates. Examples are documentation source, not library components or package exports. Mobile and desktop examples are responsive **React DOM applications and PWAs**, not React Native or packaged desktop binaries.

## Develop

Node 22.12+ and npm are required. Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`.

```sh
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm run verify:package
```

Preview: [localhost:5173](http://127.0.0.1:5173). Routes: `/components`, `/docs/theming`, `/docs/customization`, `/blocks`, `/templates`, `/examples` and `/changelog`.

## Install

```sh
npm pack
# In a consuming React application:
npm install /path/to/plain-ui-0.2.0.tgz
```

React and React DOM 18.3 or 19 are peers. ESM modules and TypeScript declarations are provided; CSS is opt-in. Consumers do not need Tailwind to use the compiled defaults. Tailwind CSS 4.3.3 builds the included stylesheet, and native classes/styles can override it.

```tsx
import { PlainProvider, Button, Field, Input } from '@plain/ui';
import '@plain/ui/styles.css';

export function App() {
  return (
    <PlainProvider>
      <form onSubmit={(event) => event.preventDefault()}>
        <Field label="Project name">
          <Input name="project" required />
        </Field>
        <Button type="submit">Create project</Button>
      </form>
    </PlainProvider>
  );
}
```

## Theme Without Rebuilding

Root roles cover surfaces, containers, text, outlines, primary/secondary/tertiary pairs, statuses, inverse surfaces, charts, spacing and motion. Component aliases inherit those roles and can be overridden individually. `tokenNames`, `tokenVariable`, `themeCSS` and the exported token types provide a discoverable contract.

```tsx
<PlainProvider
  dir="rtl"
  theme={{
    color: '#087f5b',
    scheme: 'tonal',
    mode: 'system',
    radius: 4,
    density: 'comfortable',
    borders: 'subtle',
    motion: 'system',
    contrast: 0,
  }}
  tokens={{ 'sidebar.background': 'var(--ui-surface-low)', 'dialog.radius': '12px' }}
  styles={{ 'button.root': 'font-semibold' }}
>
  <App />
</PlainProvider>
```

A seed color generates the complete light/dark palette, not just the action color. `color: null` with the neutral accent restores neutral defaults. `borders: 'none'` removes the default border treatment without removing focus indicators. `motion: 'reduced' | 'none'` removes travel and animation; `system` follows the operating system. `createTheme` generates static theme tokens and CSS for SSR or builds. Material Color Utilities is intentionally pinned to the compatible `^0.3.0` line because 0.4.0 has broken Node ESM imports in the tested environment.

Use one `PlainProvider` at the application root. It sets document appearance and direction without a layout wrapper. `ThemeScope` isolates token overrides and mixed direction; scoped portals remain in that scope. `StyleProvider` scopes named part classes. Local classes and inline styles win.

```tsx
<ThemeScope dir="rtl" tokens={{ background: '#fff', 'sidebar.background': '#f5f5f5' }}>
  <YourWorkspace />
</ThemeScope>
```

Custom overrides are not automatically contrast-validated. Preserve foreground/background pairs and verify focus, state and contrast in both modes. Preferences persist and synchronize across tabs; set `persist={false}` for application-managed settings. For SSR, render matching HTML theme/direction attributes or apply `createTheme().css` before hydration.

## Extend Native Components

```tsx
import { Button, extendComponent } from '@plain/ui';

const AppButton = extendComponent(Button, {
  defaults: { size: 'sm' },
  variants: {
    tone: { quiet: 'bg-transparent', brand: 'bg-primary text-primary-foreground' },
  },
  defaultVariants: { tone: 'brand' },
  tokens: { 'button.radius': '2px' },
});

<AppButton tone="quiet" onClick={save}>
  Save
</AppButton>;
```

Variants are inferred, consumed before reaching the DOM, and compose with native props and refs. Caller props, handlers, classes and inline styles override defaults. `compoundVariants`, `styles`, and tokens cover shared rules without a new component API. `unstyled` removes default classes, not semantics or behavior. For entirely custom CSS, omit `styles.css`, optionally import `tokens.css`, and provide positioning, focus styles and usable targets yourself.

## Optional Features

| Entry                     | Purpose                                                                                         | Extra CSS                     |
| ------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------- |
| `@plain/ui/layout`        | Box, Flex, Stack, Inline, Grid, Masonry, Container, Center, Spacer, SplitPane                   | Core styles                   |
| `@plain/ui/virtual`       | Standalone VirtualList, VirtualGrid, VirtualMasonry                                             | Core styles                   |
| `@plain/ui/sidebar`       | AppShell, responsive Sidebar, bottom navigation, Stepper, TreeView                              | Core styles                   |
| `@plain/ui/advanced`      | Numeric/search/password/PIN fields, file upload, tags, multiselect, menus, ratings and activity | Core styles                   |
| `@plain/ui/date-time`     | Time, date-time and range controls                                                              | Core styles                   |
| `@plain/ui/typography`    | H1-H6, P, Span, Small, Strong, Em, A, Code, Pre, Blockquote, Ul, Ol, Li, Mark                   | Core styles                   |
| `@plain/ui/charts`        | Recharts area, bar, line, donut and composable parts                                            | `@plain/ui/charts.css`        |
| `@plain/ui/full-calendar` | FullCalendar month/week/day/agenda scheduling                                                   | `@plain/ui/full-calendar.css` |
| `@plain/ui/motion`        | Lazy MotionProvider, Motion, Presence and presets                                               | No extra CSS                  |

Charts, scheduling and Motion are not exported through the core barrel. Dependencies are externalized and modules are tree-shakeable; install size is not the same as browser bundle size. Core controls use Radix, command search uses cmdk, date selection uses DayPicker, sheets/drawers use Vaul and inverse notifications use Sonner. Font assets are documentation-only; the library uses a system sans-serif fallback.

Default light/dark colors are the original hand-authored 0.1 neutrals. Material-style palette generation is opt-in when a vibe color or colored preset is chosen. New semantic and component tokens inherit those defaults without changing their identity.

Blocks and templates are available at `/blocks` and `/templates`. Copy or download a complete TSX file into your own application. It includes its local React implementation, sample data, helpers and editable CSS, and imports only UI primitives and the engines it uses. There is no `@plain/ui/blocks` runtime or registry to install. The source is yours to change; sample workflows still need real backend integration.

Layout spacing numbers are 8px units; strings accept CSS lengths. Responsive objects use `base`, `sm`, `md` and `lg`. Virtualization requires a constrained viewport and stable keys; it is optional because browser find and assistive technology cannot discover every unmounted record. Offer search or a nonvirtual view where needed.

Date-time values are local wall-time strings. IANA timezone validation and Temporal disambiguation are available; storing an instant requires explicit conversion and a backend policy. FullCalendar and DataTable are UI engines, not scheduling or data backends. Blocks/templates implement local prototype workflows, not real authentication, payments, uploads or persistence. Native forms require server-side validation in production.

`Field` takes a single control accepting `id` and ARIA attributes. Place `SelectTrigger` inside `Field`, not the non-DOM `Select` root. Give icon-only controls accessible names. Use logical spacing and `dir` for RTL rather than reversing the DOM order. Sheets support logical `start`/`end`, physical sides, swipe gestures and snap points.

## Quality And Releases

The documentation has complete version snapshots at `/v/0.1.0/` and `/v/0.2.0/`.
The current version tracks this checkout until frozen; historical pages use their
own implementations, dependencies, API tables, search, examples and downloads.
Version switching keeps available deep links and intentionally falls back when a
page did not exist yet. See [the archive workflow](docs/versions/README.md) and
[docs/versions.json](docs/versions.json) for registering releases and hosting rules.
Component pages include 54 typed prop playgrounds with matching copyable TSX.

Charts accept native axis/grid/legend/tooltip props as well as visibility booleans.
Use `stacked`, area/line `curve`, or per-series `strokeDasharray` for different data
views. Colors still follow the theme unless configured. Tooltip surface and
foreground tokens should be overridden as a pair. Dialog motion defaults to 320ms
entry and 200ms exit; override `dialog.duration-enter` and `dialog.duration-exit`
without changing reduced/none motion behavior.

Tests cover behavior, native forms, scoped portals, palettes, SSR, package-consumer examples and tree shaking. Browser QA covers responsive layouts, light/dark, RTL, keyboard behavior, motion policies, rendered assets and automated accessibility. See [QA.md](QA.md) for the actual verified results and limits. Automated checks are not a WCAG certification; final applications still need assistive-technology, device, security and backend testing.

Agents follow [AGENTS.md](AGENTS.md) and the repository's P.UI design skill. Releases use Changesets; see [CONTRIBUTING.md](CONTRIBUTING.md), [CHANGELOG.md](CHANGELOG.md) and [docs/releases](docs/releases/README.md). `dist/` contains the library and `site-dist/` the website. Nothing is published or deployed automatically.

## License

MIT. See [LICENSE](LICENSE).
