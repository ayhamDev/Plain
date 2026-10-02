# P.UI 0.2.0 QA

Local integration checked on **2026-10-01**, Windows, Node **24.13.0**, React
**19.3.0**, TypeScript **6.0.0**, Vite **8.3.1**, and Tailwind CSS **4.3.3**.
The candidate is the `codex/next` commit containing this record, based on the
preserved `0188733` baseline. Use `git log -1 -- QA.md` to identify that commit.
The original 0.1 evidence is archived in [docs/releases/0.1.0-qa.md](docs/releases/0.1.0-qa.md).

**2026-10-02 follow-up:** Seeded surface hierarchy and chart palettes, gradients,
series inference and tooltip rendering changed after the browser/unit evidence
below. Those suites were not rerun at the user's explicit request. Do not treat
the earlier browser results as validation of these final visual refinements.
The follow-up passed TypeScript compilation, ESLint and the library/docs build;
the existing lockfile required restoration of a missing optional dependency entry.

## Checks

Use `npm.cmd` instead of `npm` on Windows when PowerShell blocks `npm.ps1`.

| Check                          | Result                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run typecheck`            | Passed                                                                                                                               |
| `npm run lint`                 | Passed                                                                                                                               |
| `npm run format:check`         | Passed                                                                                                                               |
| `npm test`                     | **169 tests in 7 files passed**                                                                                                      |
| `npm run build`                | Library declarations/CSS/ESM and production documentation built                                                                      |
| `npm run verify:package`       | **91 public component examples and 180 independent compositions compiled**; exports, tree shaking, installed consumer and SSR passed |
| Packed-package React peers     | SSR smoke checks passed on **18.3.1 and 19.3.0**, including native headings and `inert` loading content                              |
| `npm audit --omit=dev`         | **0 reported production dependency vulnerabilities** at check time                                                                   |
| `npm run release:status`       | Passed; 0.2.0 is already assigned, no pending bump                                                                                   |
| Production Chromium suite      | Earlier 398-scenario run completed; saved last-run status is passed with no failed tests                                             |
| Cross-engine visual/axe checks | Earlier Chromium/Firefox reports completed; WebKit evidence predates the last inert/typography refinements                           |

The scoped TypeScript contract test compiles all 180 downloaded modules. It has
a 120-second limit, with two unit workers to bound memory; ordinary tests retain
their normal limits. Accessibility scans wait for the Motion example to finish
its initial fade instead of measuring transient opacity. No contrast rule is
disabled and browser retries remain zero.

## Browser Coverage

The complete Playwright suite runs against the production preview:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5174 npx playwright test --workers=3 --output=.preview/qa-release-final
```

PowerShell sets `$env:PLAYWRIGHT_BASE_URL` before running the command. The dev
server remains at `http://127.0.0.1:5173`; the temporary production preview is
used only for release checks. `npm run test:e2e` also builds the library and
generates missing copy/paste sources before collecting tests on a fresh checkout.

Coverage includes every documented component in desktop light and mobile dark
RTL, home widths 320/390/768/1440px, twelve preset/mode combinations, all 120
blocks and 60 multi-screen templates, search, empty states, pagination, copy,
actual downloaded bytes, source-dialog initial/return focus, form validation,
table/kanban/cart changes, and local template record creation/search/archive.

Four isolated browser tests build actual downloaded TSX with the compiled package
styles, remove the documentation's styles, and mount it independently. They cover
all twelve block families and representative web/mobile templates in light LTR
desktop and dark RTL mobile, including working local-state navigation.

Dedicated checks exercise native date/time/range forms, DST rejection and wall
time, month/week/day/list calendar views, actual chart plots/pixels and data
alternatives, virtualized 1,000-item layouts, keyboard resizing, native form
participation, logical RTL controls, scoped portals, focus restoration, Vaul
swipe/snaps, initial/exit dialog centering, visible/pulsing skeletons, switch
geometry/rounding, scroll viewport wheel/keyboard behavior, inverse notifications,
and border/motion opt-outs.

`scripts/final-visual-qa.mjs` captures **17 scenarios per engine** on Chrome,
Firefox and Playwright WebKit, with viewport and full-page PNGs, runtime errors,
horizontal overflow, visible image loading, browser versions, and axe WCAG
2.x A/AA-tagged scans. Scenarios include 320/390/640/1440/1920px, original
neutrals, explicit blue/rose palettes, light/dark, LTR/RTL, typography, submenus,
sheets, dialogs, time controls, calendars, charts and copied examples.

Evidence is local and git-ignored: `.preview/qa-release-final`,
`playwright-report`, and `.preview/final/{chromium,firefox,webkit}/report.json`
and screenshots. Representative desktop/mobile, submenu, sheet, typography,
calendar, chart, dialog and template images were visually inspected. Firefox
required an approved run outside the Windows sandbox to launch tab subprocesses;
the tested browser remained headless and used only the local preview.

## Package And Performance

The archive is `public/plain-ui-0.2.0.tgz`, containing **129 files**. The verifier
rejects block/template/composition modules, documentation fonts/images and old
archives in the package. All export targets resolve. React peers are external;
CSS is opt-in, and consumers do not need Tailwind or the documentation font.

The measured Button-only bundle is **19,992 gzip bytes** (React external).
DayPicker, TanStack, cmdk, Sonner, Recharts, FullCalendar, Motion, Material Color
Utilities, Vaul and resizable panels are absent from that bundle. Core CSS is
**110.25 kB / 19.41 kB gzip**; tokens-only CSS is **15.28 kB / 2.74 kB gzip**.

The documentation's initial application chunk is **552.70 kB / 164.64 kB gzip**,
with a separate React vendor chunk. Vite reports its 500 kB chunk warning; this
is not suppressed and is a remaining documentation performance improvement.
Charts, calendars, Motion and composition previews are split into lazy chunks;
complete copy/paste source is fetched on demand with a bounded cache. The npm
archive size is not the browser transfer size or total dependency install size.

## Limits

Automated axe scans and screenshots do **not** establish full accessibility
conformance. Screen-reader testing, physical iOS/Android devices, software-keyboard
behavior, production integrations and remote CI were not independently verified.
React 18 checks are SSR smoke coverage, not the full browser matrix; browser
workflows use React 19. Virtualized offscreen content needs application search or
a nonvirtual alternative. Custom colors and unstyled components require their
own contrast/focus validation.

Blocks/templates implement local prototype state, not real authentication,
payments, uploads, durable persistence, security or scheduling backends. Mobile
and desktop examples are React DOM/PWA interfaces, not native mobile controls or
packaged desktop apps. Dependencies are covered by the current audit only, not
an enterprise security assessment. No npm publication or hosted deployment was
requested or performed.
