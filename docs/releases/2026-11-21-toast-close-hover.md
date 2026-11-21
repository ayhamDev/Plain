# Subtle toast close-button feedback

Validated after `a178960` on 2026-11-21, with a pending patch Changeset for
`@plain/ui`. The local package remains 0.2.0. No npm publication or deployment
is implied.

Sonner's dynamically injected hover selector tied the library's specificity and
replaced its subtle close-button tint with a bright background. P.UI now uses a
more specific selector and an 8% tint of the toast's foreground. The icon keeps
the toast's foreground color. Keyboard focus uses a transparent background and a
2px outline in that same local foreground, keeping it visible on inverted toasts.
The fix adds no `!important`, public API, dependency or token. Native inline close
styles still override the defaults; button geometry and dismissal are preserved.

Validation:

- All 372 tests passed: 9 infrastructure, 357 library and 6 docs tests. The full
  run used `--concurrency=1 -- --testTimeout=15000 --maxWorkers=1`; repository
  timeout settings were not changed. No new repository test was added for this
  small styling fix.
- TypeScript, ESLint, workspace boundaries, formatting, Changesets status,
  library/docs builds and package verification passed. Installed-package checks
  compiled 106 examples and verified React 18.3.1/19.3.0 server rendering. The
  refreshed docs archive contains 261 files and is 584,046 bytes. Button/layout
  gzip sizes remain 17,445/15,787 bytes.
- Chrome 157.0.8103.79 passed 12 source-fixture scenarios covering inverted and
  surface toasts, light/dark Sonner CSS scopes, custom palettes and rich-color
  CSS. The harness switches Sonner's theme data attribute to exercise both
  selector scopes. Hover background contrast stayed below 1.28:1 against the
  toast, while icon contrast remained above 11:1. Pointer and Enter dismissal,
  unchanged button dimensions, keyboard focus and native inline overrides passed.
  Scoped Axe WCAG A/AA audits found no violations; no runtime errors occurred.
- Four existing browser tests passed: light/LTR and dark/RTL inverse defaults,
  explicit surface/per-toast inverse overrides, and phone/RTL action/close
  alignment. These also verify action behavior and accessibility.
- Compiled docs passed 12 scenarios: success, error and action toasts at
  1440x1000 light/LTR/system motion/1x density, 720x1000 dark/LTR/no motion/2x,
  320x900 light/LTR/system motion/1x and 390x900 dark/RTL/reduced motion/2x.
  Hover, readable icons, keyboard focus and dismissal passed. Scoped Axe audits
  reported no violations; pages had no runtime errors or horizontal overflow.
  Phone hover and dark/RTL focus screenshots were visually inspected.

Evidence is in `.preview/toast-close-{typecheck,unit,lint,format,changesets,build,package}.log`,
`.preview/toast-close-pack.json`, `.preview/toast-close-browser.log` and
`.preview/toast-close-alignment.log`. The private QA harness reports and
screenshots are in `.preview/toast-close-qa/`, including `results.json` and
`production.json`. Physical devices, Safari, screen readers and remote CI were
not verified here.
