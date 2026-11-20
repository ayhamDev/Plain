---
'@plain/ui': minor
---

Expose standalone DataTableSearch, DataTableSort, DataTableColumns, DataTableReset,
DataTableActiveFilters, DataTableFieldFilter, DataTableSelectionToggle and
DataTableSelectionActions. Place them alongside the existing filters, toolbar and
pagination in any application layout by passing one shared table instance.
The built-in toolbar uses the same parts.

Add showPagination to hide the built-in pagination UI while retaining paginated
rows. Keep controlled/manual state, native refs and handlers, responsive filter
and sorting sheets, selection modes and existing defaults. Document a complete
working custom layout and modular imports.
