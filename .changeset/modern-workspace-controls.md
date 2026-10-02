---
'@plain/ui': minor
---

Refine workspace controls and replace the event calendar with a P.UI-owned scheduler.

- Quieter input borders share the ordinary border role in subtle mode; strong and system high-contrast modes retain explicit boundaries. Neutral palette colors are unchanged.
- Split panes gain container-based mobile orientation and larger invisible resize targets. Sidebars gain nested menus, actions, badges, search, rail, variants, collapse modes and a scoped shortcut.
- ColorPicker and temporal pickers use themed popovers while preserving native editing, refs and forms. Progress, Slider and Stepper defaults are refined. EmptyState gains composable parts.
- DataTable exposes useDataTable, DataTableView, advanced AND/OR filters, selection, column controls and richer client/server pagination.
- FullCalendar no longer forwards FullCalendar.js options or requires its engine dependency. Migrate initialDate to defaultDate, view names to month/week/day/agenda, eventClick to onEventClick and select to onSlotSelect. Events remain application-owned; use onEventsChange/onEventChange, rendering hooks and custom printing. Ref API is now P.UI-owned.
- Remove the app-specific Stat export. Compose metric markup in applications instead.
- Retire generated blocks/templates and the combined guide. Collections remain empty; future examples will be copy/paste application source, not package exports.
- Integrate property controls into the primary documentation preview without a duplicate canvas. Historical 0.1 documentation remains pinned and unchanged.

This is a pending minor release during 0.x, not a version assignment or registry publication.
