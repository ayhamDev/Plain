# Local component token overrides

Integrated after `2ebf696`, with a pending patch Changeset for `@plain/ui`.
The manifest remains the local 0.2.0 candidate; this is not an npm publication.

Individual controls use the existing typed `tokensToStyle` helper on their native
`style` prop. `ThemeScope` covers groups and scoped portal content;
`extendComponent` supplies reusable component defaults. The customization guide
now demonstrates all three, including input height/border/radius overrides,
independent Switch track/thumb shapes and a scoped popup. The package README
includes the same entry points. No new wrapper or runtime context is introduced
for an instance override.

The Switch thumb previously inherited a radius calculated at the theme ancestor,
so overriding only the local track radius left its thumb at the global shape.
Automatic thumb rounding now resolves on the thumb itself. Its default token is
`initial`, which selects the local track-radius-minus-2px fallback, clamped at
zero. Explicit `switch.thumb-radius` values still win; `initial` also resets an
inherited explicit thumb override to automatic. Default appearance, native props,
refs, form values, disabled state and direction behavior are retained.

Validation passed:

- ESLint and workspace boundaries, TypeScript, Prettier, and the library/docs build.
- The full suite: 9 workspace checks, 207 library tests and 6 documentation tests.
  The 12 theming tests include native Switch form/ref/keyboard behavior and caller
  token precedence over reusable defaults.
- Four focused Playwright cases: 1440px light/LTR, 320px light/LTR, 390px dark/RTL,
  and the customization guide. Global radius changes from 6px to 24px and 0px
  update ordinary controls while preserving instance overrides. Explicit and reset
  thumb tokens, disabled controls, form submission, ref focus, Space toggling,
  scoped portals, focus restoration and containment passed.
- Four additional production-guide scenarios in Chrome 157.0.8103.79: 1440px
  light/LTR at 6px radius, 320px light/LTR at 0px, 390px dark/RTL at 24px, and a
  720px reflow viewport with a custom blue theme at 12px. The changed controls and
  open popup had no detected Axe WCAG A/AA violations or document overflow.
  Screenshots were inspected; no browser page errors were reported.
- Package validation: 217 files in the 473,315-byte archive, 103 existing examples
  compiled, CSS/subpath exports checked, and SSR passed with React 18.3.1 and
  19.3.0. Both new guide snippets also compiled against the installed archive.
  The Button-only bundle is 20,002 bytes gzip within its 25kB budget, with heavy
  features excluded.

Local evidence is under the ignored `.preview/component-overrides-qa/` directory,
including `production.json` and instance/popup screenshots. Check logs are in
`.preview/component-overrides-*.log`; focused test artifacts are under
`apps/docs/test-results/`. Browser coverage was scoped to this change; other
engines, physical devices, actual browser zoom and screen readers were not tested.
