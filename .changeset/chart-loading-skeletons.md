---
'@plain/ui': minor
---

Replace loading text with neutral, chart-shaped skeletons across all chart families, including heatmap and Gantt. Loading announcements remain available to screen readers, chart heights stay reserved, and reduced/disabled motion uses static placeholders. Hide stale data tables and legends while loading.

Export the lightweight `ChartSkeleton` from the core and charts entry points for matching lazy-loading fallbacks without importing the chart engine. Support chart variants, dimensions, motion, localization, theme tokens and styling slots, and add `Chart.loadingVariant` for custom compositions. Documentation chart previews use the same skeletons while downloading.
