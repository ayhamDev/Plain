# Navigation hover and overlay expansion

Validated locally on **November 22, 2026** against implementation commit
`e8fd34298eb2c24b73acb374e8fd90ef497848a2` (based on `a137d77`). The follow-up
commit records verification; it adds no component behavior.

## Behavior

SidebarProvider and NavigationRail accept `expandOnHover`, `expansionMode`,
`hoverOpenDelay`, `hoverCloseDelay` and `overlayBackdrop`. Defaults remain manual
and inline. Hover/focus previews preserve persistent state. Overlay layout reserves
compact width, expands above content and dims the enclosing SidebarProvider or
AppShell; a standalone rail uses a viewport backdrop. Oversized panels are bounded
and recompute their available width on resize.

NavigationRail adds controlled/uncontrolled expansion and expanded width. Sidebar
context reports effective visibility separately from pinned collapse state.
Triggers can pin a preview. Put pin controls inside Sidebar so they remain above
an active backdrop. Escape and backdrop clicks dismiss expansion. A missing
external trigger falls back to a surviving navigation item when restoring focus.

Hover requires a fine mouse pointer. Mobile Sidebar retains the original Sheet.
Motion policy, logical sides, English/Arabic messages, native refs/handlers,
styling slots, component-local paint and unstyled composition remain available.

## Checks

| Check                                             | Result                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Targeted UI regression suite                      | 89 passed across navigation, layout, refinements, edge handles and workspace controls                 |
| Final navigation/theming suite                    | 24 passed, including focus restoration without an external trigger                                    |
| Documentation tests                               | 6 passed, including configurable example compile checks                                               |
| Typecheck, lint, workspace boundaries, formatting | Passed; final docs/example typecheck and lint were refreshed after the example updates                |
| Package/docs build                                | Passed                                                                                                |
| Packed consumer                                   | Passed: public imports/CSS declarations, 108 examples, React-free palette and React 18.3.1/19.3.0 SSR |
| Bundle/export gate                                | Passed: 126 runtime entries, 29 import comparisons and 11 stylesheets; no budget increases            |
| Compiled browser                                  | 23 navigation/overflow checks passed, plus the documentation controls/pin workflow                    |

Browser: installed Chrome **157.0.8103.79** on Windows. Scenarios included 320px
and 390px mobile layouts, 800–1440px desktop layouts, light/dark, LTR/RTL,
reduced motion, touch emulation, 48px/64px compact widths and long menus.
Assertions cover layout stability, backdrop hit testing, local backdrop colors,
inline reflow, manual pinning, keyboard focus/Escape, portaled modal/nonmodal
menus, oversized rail resizing, scrolling and accessibility scans of open panels.

Physical-device, software-keyboard and screen-reader validation was not performed.
Remote CI was not observed in these local results.

The feature has a pending minor Changeset. No version bump or publication is
included. Package verification temporarily packs the working tree; the existing
validated `plain-ui-0.3.0.tgz` was restored unchanged afterward (SHA-256
`564F02DE2160232F57D8D9A45426C44489C4334E0E34375D4D621930CFDC0E84`).

## Reproduction and evidence

```sh
npm run test --workspace=@plain/ui -- tests/navigation-expansion.test.tsx tests/theming.test.tsx --maxWorkers=1
npm run test:e2e -- tests/e2e/navigation-expansion.spec.ts tests/e2e/sidebar-overflow.spec.ts --workers=1
npm run check:bundles
```

The browser command uses the development server by default. The local compiled
run used `.preview/navigation-qa.config.mjs` to include the fixture HTML alongside
the docs app, with `PLAYWRIGHT_BASE_URL` targeting that isolated preview.

Local, Git-ignored evidence: `.preview/navigation-unit.log`,
`.preview/navigation-final-validation.json`, `.preview/navigation-docs-tests.log`,
`.preview/navigation-final-package.log`, `.preview/navigation-final-bundles.log`,
`.preview/navigation-final-production-browser.log` and
`.preview/navigation-docs-options-browser.log`. Final light/dark screenshots were
inspected and retained in `.preview/navigation-evidence`. The production run also
captured RTL anchoring and the floating end-side panel under `apps/docs/test-results`.
