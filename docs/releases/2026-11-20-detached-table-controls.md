# Standalone DataTable controls

Integrated after `0720f75`, with a pending minor Changeset for `@plain/ui`.
The manifest remains the local 0.2.0 candidate; no npm publication is implied.

Search, sorting, column visibility, query reset, active filter chips, individual
field filters, selection mode and selection actions are now public components.
They join the existing filters, toolbar and pagination components. Applications
pass one `useDataTable` instance to controls and `DataTableView`, allowing each
part to live in an application-owned layout without a provider or table DOM
ancestry. The default toolbar composes the same public controls.

`showToolbar={false}` hides the built-in toolbar. `showPagination={false}` hides
the built-in pagination controls while keeping rows paginated; `pagination={false}`
still disables row pagination. Query reset clears search and filters without
resetting sorting, column visibility or selection. Selection mode is controlled
separately and shared between the external toggle and view. Existing controlled,
manual and server-data state contracts remain intact. No dependency was added.

Native input/button props, refs and cancellable handlers remain available on the
corresponding controls. Seven new typed styling slots support scoped and unstyled
usage, including portal content. The new toolbar `data-table.sort-trigger` slot
is separate from the existing column-header `data-table.sort` slot. Field-filter
triggers match the other controls' height without changing global chip styles.
The original neutral theme remains unchanged.

The new `/components/data-table-controls` example demonstrates search, advanced
and individual filters, sorting, columns, selection across pages, a working
archive action and detached pagination. The package README, guide, API catalog
and modular installed-package consumer document the shared-controller pattern.

Validation:

- TypeScript, ESLint/workspace boundaries, formatting, library/docs builds,
  installed-package verification and the final npm pack dry run passed.
- All 276 automated tests passed: 9 workspace checks, 261 library tests and
  6 documentation tests. The nine control integration tests were rerun after
  the final unstyled and styling-slot adjustments and passed. They cover
  detached controls, paginated rows with hidden UI, native refs/handlers,
  controlled proposals, filters, sorting, last-column protection, selection
  across pages, query-only reset, isolated instances, unstyled slots and SSR.
- Ten Chrome 157.0.8103.79 development Playwright cases passed, including the
  four detached layouts and six existing local/remote table, mobile filter-sheet
  and independent selection/control cases.
- Four final production cases passed at 1440px light/LTR, 800px dark/LTR,
  320px light/LTR and 390px dark/RTL. Each exercises pagination, search, filtering,
  sorting, column visibility, selection across pages and the archive action.
  Control heights match, applicable scoped Axe WCAG A/AA scans pass, and neither
  the preview nor document has horizontal overflow. No page errors occurred.
  All four production screenshots were visually inspected.
- The verified archive contains 237 files and is 513,496 bytes. All 106 public
  examples and the modular type consumer compile. Package SSR checks pass with
  React 18.3.1 and 19.3.0. The Button-only bundle remains 20,174 bytes gzip within
  its 25kB budget, with heavy table features excluded. The docs download archive
  was refreshed.

Evidence is in ignored `.preview/table-controls-qa/`,
`.preview/table-controls-*.log`, `.preview/table-controls-pack-final.json` and
`apps/docs/test-results/`. Physical mobile devices, other browser engines and
screen-reader sessions were not tested.
