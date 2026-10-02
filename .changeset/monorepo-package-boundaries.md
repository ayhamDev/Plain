---
'@plain/ui': minor
---

Move @plain/ui into an independently versioned npm workspace while preserving its
existing public imports, ESM/declaration layout, CSS entry points, React peers and
neutral styles. Keep documentation assets and private tooling out of the package.

Expose the existing typed table query/filter helpers through @plain/ui/data-table
and the core entry so remote integrations and the docs no longer import private
implementation modules.
