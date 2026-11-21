# Single filter summary in simple mode

Validated after `3dd4fd5` on 2026-11-21, with a pending patch Changeset for
`@plain/ui`. The local package remains 0.2.0. No npm publication or deployment
is implied.

Simple DataTable toolbars previously showed active values both inside their field
buttons and again in a separate row of removable badges. The shared toolbar now
renders that badge row only in advanced mode. Simple mode retains the field
buttons, editing, per-field Clear and Reset. This applies to DataTable,
DataTableView and separately placed DataTableToolbar instances, including remote
data. Explicitly composed DataTableActiveFilters remains available for custom
layouts. No filtering, query-state, export, dependency or public-prop change was
introduced. The README and filterMode documentation describe the presentation.

Validation:

- All 372 repository tests passed: 9 infrastructure, 357 library and 6 docs tests.
  The full run used `--concurrency=1 -- --testTimeout=15000 --maxWorkers=1`.
  No repository test was added for this small rendering change.
- TypeScript, ESLint, workspace boundaries, formatting, Changesets status,
  library/docs builds, package verification and pack dry-run passed. Installed
  package checks compiled 106 examples and verified React 18.3.1/19.3.0 server
  rendering. The refreshed docs archive contains 261 files and is 584,680 bytes.
  Button/layout gzip sizes remain 17,445/15,787 bytes.
- Chrome 157.0.8103.79 passed eight compiled-docs scenarios: local and remote data
  at 1440x1000 light/LTR/system motion/1x density, 720x1000 dark/LTR/no motion/2x,
  320x900 light/LTR/system motion/1x and 390x900 dark/RTL/reduced motion/2x.
  Number and text filters updated the field buttons without duplicate badges;
  filtered rows, per-field Clear and Reset worked. Switching to advanced mode
  restored one badge per active rule; switching back retained the filter values
  and removed that row. Phone editors used bottom sheets. Scoped Axe WCAG A/AA
  audits found no violations, with no page errors or horizontal document overflow.
  Desktop, narrow-phone and dark/RTL screenshots were visually inspected.
- Four existing browser tests passed against the compiled docs, verifying
  independently placed advanced filters, removable badges, search, sorting,
  columns, pagination and selection across desktop and phone layouts.

Evidence is in `.preview/simple-filter-{typecheck,unit,lint,format,changesets,build,package}.log`,
`.preview/simple-filter-pack.json`, `.preview/simple-filter-browser.log`,
`.preview/simple-filter-controls.log` and its browser report. Additional results
and screenshots are in `.preview/simple-filter-qa/results.json` and the same
directory. Physical devices, Safari, screen readers and remote CI were not
verified here.
