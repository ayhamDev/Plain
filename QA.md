# P.UI QA

**Latest workspace upgrade (2026-10-02):** See the
[integration record](docs/releases/workspace-upgrade.md) for the final 176-unit
run, 426 distinct browser scenarios verified across the full run and focused
recovery runs, package checks, visual evidence and remaining validation limits.
The older records below retain their original scope and results.

Local integration checked on **2026-10-01**, Windows, Node **24.13.0**, React
**19.3.0**, TypeScript **6.0.0**, Vite **8.3.1**, and Tailwind CSS **4.3.3**.
The candidate is the `codex/next` commit containing this record, based on the
preserved `0188733` baseline. Use `git log -1 -- QA.md` to identify that commit.
The original 0.1 evidence is archived in [docs/releases/0.1.0-qa.md](docs/releases/0.1.0-qa.md).

**Earlier 2026-10-02 tone follow-up:** Seeded surface hierarchy and chart palettes,
gradients, series inference and tooltip rendering changed after the original
browser/unit evidence. At that stage the suites were not rerun at the user's
explicit request; compilation, ESLint and builds passed. The existing lockfile
required restoration of a missing optional dependency entry. The subsequent
versioned-docs task has the fresh, scoped evidence below, not a full matrix rerun.

## Versioned Docs Follow-up (2026-10-02)

The current checkout remains the local 0.2.0 candidate; the new minor Changeset
plans 0.3.0 and has not been consumed or published. The archive at `/v/0.1.0/`
is built from `0188733be1298cedd76cf75544c182cc603ae9ff` using its own dependency
lockfile and build tooling. The generated registry inventories **56 historical
pages** and **292 current pages**. Current explicit URLs track this checkout until
the release is frozen, as described in [docs/versions](docs/versions/README.md).

| Fresh Check                               | Result                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| TypeScript, ESLint, Prettier              | Passed                                                                                                             |
| Focused unit tests                        | **39 passed in 2 files**: version contracts, manifest retry, playground source compilation and chart/date behavior |
| Production build                          | Library ESM/CSS/declarations, independent archive and current docs passed                                          |
| Version/preview/release browser workflows | **19 passed**, no retries                                                                                          |
| Native chart rendering workflows          | **2 passed**, including raster-pixel checks for all four chart types                                               |
| Packed installed consumer                 | **91 component examples and 180 independent compositions compiled**; exports, SSR, peers and tree shaking passed   |
| Changesets status                         | Passed; a minor bump is pending, not applied                                                                       |

Production browser checks used Chrome **154.0.8037.95**, React 19, and
`http://127.0.0.1:5175` with 320/390/1440px viewports, light/dark, LTR/RTL,
neutral/explicit blue themes, and system/reduced/none motion. Commands:

```sh
npx vitest run tests/docs-previews.test.tsx tests/date-charts.test.tsx
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5175 npx playwright test tests/e2e/docs-versioning.spec.ts tests/e2e/release-workflows.spec.ts --workers=2 --output=.preview/qa-versioned-docs
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5175 npx playwright test tests/e2e/date-charts.spec.ts --grep "all native chart types|motion-none disables chart" --workers=1 --reporter=list --output=.preview/qa-versioned-chartplots
```

Version checks exercised all 56 historical pages, isolated assets and preferences,
old package downloads, search, same-page/query/fragment switching, unavailable-page
fallback, reload, mobile navigation and unknown-version 404s. A subsequent rerun
of the version workflow also verified direct loading of the versions guide in dev
and production, after correcting a dev source-module/HTML routing collision.
All **54 prop
playgrounds** rendered with matching source on desktop light LTR and 320px dark
RTL; unit checks compiled every default, enum choice, boolean and numeric boundary
against current public types. Select checks measured both positioning modes,
disabled options, applicable controls, source reset and focus restoration.

Chart checks exercised native config overrides, stacking, curves, dash patterns,
axes/grid/legend/tooltip visibility, loading height, data tables and automatic
palette colors. Keyboard-selected tooltip values matched source data and had
measured contrast of at least 4.5:1 in all three chart profiles. Automated WCAG
2.x A/AA-tagged scans reported **zero violations** on the two Select pages and
the three chart/prop-playground surfaces. An initial full-page narrow chart scan
exceeded its 45-second test budget; the final scan targets the changed chart and
playground surfaces, without disabling any rules or increasing the timeout.

Dialog checks measured 320ms entry and centered keyframes, initial/return focus,
Escape/Done dismissal and reduced/none policy. Exit CSS defaults to 200ms; its
duration was not independently timed. Screenshots of the charts, Select modes,
archived navigation and dialog were visually inspected. Local evidence lives in
`.preview/qa-versioned-docs`, `.preview/qa-versioned-chartplots`, `.preview/qa-docs-guide` and
`playwright-report`; generated evidence is Git-ignored.

The packed archive contains **129 files / 259,655 bytes**. The Button-only bundle
is **20,016 gzip bytes**, excluding the optional domain engines. Core CSS is
**110.57 kB / 19.50 kB gzip**; tokens CSS is **15.38 kB / 2.76 kB gzip**. The
current docs application chunk is **175.82 kB / 53.28 kB gzip**, with a separate
**218.89 kB / 68.30 kB gzip** React vendor chunk and other shared/lazy chunks;
these are individual chunk sizes, not total page-transfer measurements.

The complete earlier unit/browser matrix, Firefox/WebKit, physical devices,
assistive technology, deployment rewrites and remote CI were not rerun in this
scope. Historical defects are preserved in the archive, not silently backported.
The limitations below still apply.

## Earlier Checks (2026-10-01)

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

## Earlier Browser Coverage

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

## Earlier Package And Performance

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
