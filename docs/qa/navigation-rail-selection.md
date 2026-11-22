# Navigation rail selected state

Validated locally on **November 22, 2026**, on the working tree based on
`368cf24`. A patch Changeset records this fix; no version bump or publication is
included.

The rail's animated indicator used primary-container colors while the sidebar's
active rows used sidebar accent colors. A theme could make the rail indicator
blend into its surface. The rail also had no selected background before the
indicator was measured. It now uses the sidebar active background and foreground
tokens and paints a fallback selected background until the indicator is ready.
The existing hover geometry and transitions are unchanged.

Verification:

- Navigation expansion and theming unit tests: **25 passed**.
- Production browser tests: **28 passed**, including four selected-state cases,
  ten motion cases and fourteen existing navigation expansion cases.
- Typecheck, lint, formatting, library/docs builds and packed consumer: passed.
  The packed consumer compiled 108 public examples and verified React 18.3.1 and
  19.3.0 SSR.
- Compiled sidebar/navigation-expansion source maps matched the current source.
  The released `plain-ui-0.3.0.tgz` was preserved unchanged (SHA-256
  `564f02de2160232f57d8d9a45426c44489c4334e0e34375d4d621930cfdc0e84`).

Chrome **157.0.8103.79** on Windows. Selected-state checks cover the actual docs
example at 320px, 390px and 1440px, component-local active colors, light/dark,
LTR/RTL, the unmeasured fallback, item changes, and expanded/collapsed rails.
Screenshots of the compact default and custom RTL selections were visually
reviewed. Physical devices and screen readers were not tested; remote CI was not
observed.

Git-ignored evidence: `.preview/rail-selection-validation.json`,
`.preview/rail-selection-production-tests.log` and screenshots under
`apps/docs/test-results/navigation-selection-*`. Production browser verification
used `.preview/navigation-qa.config.mjs` on a separate local preview. The normal
docs server on port 5173 was preserved.
