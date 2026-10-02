# PlainUI 0.1.0 Validation

Validated locally on October 1, 2026, using Node 24.13.0 on Windows. This is a local release, not an npm publication or a formal accessibility certification.

## Completed Checks

| Check                                                | Result                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| TypeScript, ESLint, Prettier                         | Passed                                                            |
| Library regression tests                             | 29 passed                                                         |
| Production-site Playwright tests in Chrome           | 120 passed                                                        |
| Responsive visual and accessibility scenarios        | 7 each in Chrome, Firefox, and WebKit                             |
| Compilable component documentation examples          | 44 passed in an independent package consumer                      |
| Package installation, exported declarations, and SSR | Passed                                                            |
| Button-only tree-shaking check                       | Passed; calendar, data table, command, and toast engines excluded |

The browser suite covers all component pages in desktop light mode and mobile dark RTL mode, twelve appearance/accent combinations including accent-button hover, keyboard navigation, focus restoration, dialogs, open selects, theme persistence, CSS downloads, date selection, combobox filtering, table sorting/filtering/pagination, CSV downloads, and mobile navigation. Home-page widths include 320, 390, 768, and 1440 pixels.

The additional browser-engine matrix covers light/dark home pages, mobile RTL, a 1920-pixel dashboard, mobile RTL input documentation, and an open mobile RTL dialog. Screenshots wait for fonts and the lazy calendar, and were visually inspected. These checks found no horizontal document overflow, uncaught page errors, or reported axe violations in the tested states. WebKit on Windows is an engine check, not testing on a physical Apple device.

Axe checks use the WCAG 2 A/AA, 2.1 A/AA, and 2.2 AA rule tags in the full suite. No accessibility rules are disabled to suppress findings.

## Package Measurements

The verified archive contains 65 files and is approximately 80.5 KB. A production button-only consumer produces 17,833 gzip bytes of JavaScript, excluding React and React DOM. Compiled default CSS is approximately 9 KB gzip and is imported separately. These measurements describe this fixture and lockfile, not a guarantee for every application or bundler.

## Reproduce

```sh
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run verify:package
npm run test:e2e
```

Local end-to-end tests use installed Chrome. CI installs Playwright Chromium. `scripts/final-visual-qa.mjs` accepts `PLAYWRIGHT_BASE_URL` and `BROWSER_ENGINE` (`chromium`, `firefox`, or `webkit`); install the selected Playwright engine first. It writes screenshots and JSON reports under `.preview/final/`.

## Remaining Release Responsibilities

Manual screen-reader testing, physical-device testing, external security review, and application-specific integration testing remain necessary before a public enterprise rollout. CI configuration is included, but no remote CI run or deployment was performed. Custom colors, labels, content, and unstyled implementations must be checked independently for contrast, localization, semantics, target sizes, and focus visibility. Automated passing results do not establish complete WCAG conformance or defect-free behavior.

These are React DOM components for responsive websites, web apps, and PWAs, not React Native controls. DataTable uses client-side data operations; server pagination and virtualization require application integration. Drawer is a bottom dialog, not a swipe-gesture engine. The example applications use local demonstration data rather than production authentication or backend services.
