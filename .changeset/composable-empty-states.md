---
'@plain/ui': minor
---

Expand EmptyState with arbitrary `actions`, `media` and `footer` nodes, three sizes
and default/muted/outlined surfaces. Preserve the existing `action` shorthand;
`actions` takes precedence when supplied. Children still fully replace the layout
for application-owned forms, lists and any number of actions.

Add EmptyStateMedia and EmptyStateFooter with native props, refs, typed styling
slots and inherited unstyled behavior. Media can be unframed or an icon container
with rounded, circular or square shape. Actions support wrapping rows or stacked
columns with logical alignment. Title and Description support `asChild` for
appropriate heading levels and rich content.

Honor `icon={null}` and `icon={false}` instead of rendering the fallback icon.
Keep mobile actions within the available width, inherit start alignment correctly,
and allow horizontal layouts to wrap. Colors continue to use the current neutral
design tokens; no dependencies or application schema are added.
