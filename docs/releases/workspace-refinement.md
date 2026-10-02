# Workspace Refinement Candidate

**Status:** Pending minor Changeset. Package remains 0.2.0; not published or deployed.

## Migration

The scheduler is now P.UI-owned and uses Temporal arithmetic instead of FullCalendar.js.
Import paths and the separate stylesheet are unchanged. Replace `initialDate` with
`defaultDate`, engine view names with `month`, `week`, `day`, `agenda`, `eventClick`
with `onEventClick`, and `select` with `onSlotSelect`. Plugin/options forwarding and
the engine ref API were removed. Use the documented P.UI callbacks/render hooks;
event edits and persistence belong to the application. Event ends stay exclusive.

`Stat` was removed because metric composition is application-specific. EmptyState
now also accepts composable children and parts. DataTable still accepts data and
columns; use `useDataTable` with `DataTableView` for owned state and manual server
operations. Search is a semantic searchbox. ColorPicker's native text field submits
hex colors and its themed popover replaces the operating-system color popup.

Subtle input borders now inherit the ordinary border, not the outline. Strong,
forced-colors and increased-contrast policies retain explicit control boundaries.
The original neutral light/dark color values remain unchanged.

The 120-block/60-template generated collection, downloads and combined guide were
retired. `/blocks` and `/templates` are empty. No block runtime exists in the package.
The archived 0.1 documentation still builds from its original pinned source.

## Verification

Local candidate checks on 2026-10-02:

- Typecheck, ESLint, Prettier and the production library/docs build pass. The docs
  build reuses the unchanged pinned 0.1 archive and generates two isolated versions.
- Vitest: 162 tests pass, including date arithmetic, DST, exclusive event ends,
  overlap layout, controlled state, native form events/cancellation, filters,
  selection, complete print content and generated preview source.
- Installed package verification passes: 90 copied component examples compile,
  zero compositions are exported, optional feature boundaries remain separate,
  and SSR works with React 18.3.1 and 19.3.0. The local archive is refreshed;
  the Button consumer is 20,507 gzip bytes and excludes heavy feature engines.
- Browser workflows cover desktop/mobile, light/dark, LTR/RTL, focus restoration,
  resizing, swipe dismissal, prop controls, filters, sorting, pagination and printing.
  Earlier broad runs exposed stale assertions, a calendar contrast defect and
  scan timeouts. Corrected scenarios pass in the final 18-case regression run.
- Chrome 154.0.8037.95 screenshots at 1440, 390 and 320px were reviewed for the
  affected controls. All 36 component captures have no document overflow.
  Local evidence is in `.preview/workspace-visuals/` and `test-results/`.
- The pending Changeset plans a minor version; the package is still 0.2.0.

The API/control ideas were informed by [tablecn](https://github.com/sadmann7/tablecn)
and [shadcn's sidebar](https://ui.shadcn.com/docs/components/sidebar), not copied styling.

Physical devices, screen-reader sessions, actual paper/PDF printer output, remote
CI, registry publication and deployment are not verified by these local checks.
