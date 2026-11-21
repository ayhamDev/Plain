# Item and chart loading paint

Validated locally on 2026-11-21, based on `64d99aa`. A minor Changeset records
the Item API addition; a patch Changeset records the chart fallback fix. This is
local validation, without registry publication or deployment.

Item is a reusable native button, composed link or static content row. It supports
controlled/uncontrolled selection, disabled activation guards, native refs and
handlers, optional media/content/title/description/trailing/actions parts, typed
styling slots, semantic tokens, shared tooltips and unstyled composition. Hover,
pressed and selected states use soft surfaces; keyboard focus stays visible.
Independent nested controls belong in a static row. File explorer and virtual
collection examples use Item. Existing List selection behavior is unchanged.
The incomplete rename request needs the intended old/new names; no names were
inferred or renamed.

Chart skeleton guide paths and line curves now define non-filled SVG paint
intrinsically. Muted fallback colors remain available before CSS is ready, and
fixed-width strokes avoid oversized lines when plots stretch. The line preview
uses calmer curves and thinner strokes. Scoped colors, reduced motion, localized
loading announcements and plot height behavior remain available.

Validation:

- All 44 focused Item, collection regression and chart-loading unit tests passed.
- The repository run passed nine tooling tests, six documentation tests and
  404 of 412 UI tests. Eight existing calendar tests exceeded the five-second
  timeout while documentation compilation ran concurrently. Both affected suites
  passed all 22 tests in a separate single-worker run with a 15-second timeout;
  calendar implementation and test sources were unchanged. The docs tests compile
  all prop playground defaults, enum choices, toggles and numeric boundaries.
- Fourteen Chrome browser scenarios passed against compiled library/docs code:
  seven chart loading scenarios and seven Item scenarios. Coverage includes
  light/dark, LTR/RTL, 320/390px narrow widths, native keyboard activation,
  controlled selection, disabled links, independent actions, tooltip dismissal,
  forced colors, reduced motion, long content and windowed collections of 10,000
  items. Axe scans and document overflow checks passed. Chart checks exercise all
  ten chart families, stable loading/ready heights, separate empty states, lazy
  module loading, live motion changes and intrinsic paint with classes removed.
  The real line-chart loading preview and narrow dark gallery were visually
  inspected, along with narrow Item rows.
- TypeScript, ESLint, workspace boundaries, formatting, library/docs builds,
  Changesets planning and diff checks passed.
- Installed-package verification compiled 107 public component examples and the
  consumer fixture, including the Item subpath and typed slots. React 18.3.1 and
  19.3.0 server rendering retained native selection semantics and disabled-link
  guards. The refreshed docs archive contains 295 files and is 632,986 bytes.
  Eager Button/Layout gzip remains 19,512/17,776 bytes with existing heavy-feature
  exclusions enforced. Package dry-run inspection passed.

Private logs and captures are under `.preview/item-*`. The corrected line capture
is in `.preview/item-browser-results/chart-loading-line-loading-aab30-tches-the-real-docs-preview/line-loading.png`.
Browser checks used local headless Chrome 157.0.8103.79; they do not establish physical device,
screen-reader, other browser engine or remote CI coverage. The user's existing
5173 server was left running; compiled browser checks used a private 5221 preview.
