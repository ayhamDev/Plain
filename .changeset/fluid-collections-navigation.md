---
'@plain/ui': minor
---

Refine shared motion timings, hover feedback, and animated active indicators for
Tabs, SegmentedControl and BottomNavigation, respecting reduced/none motion.
Sidebar collapse retains stable leading icons and preserves expanded header/footer
state while crossfading compact slots. Add a separate NavigationRail for workspace
switching beside Sidebar; SidebarRail remains the existing collapse edge control.

Sheet and Drawer default to handle-only dragging so nested sliders, text selection
and other controls cannot accidentally drag the panel. Set `handleOnly={false}`
to opt into the previous content-dragging behavior. Vertical panels supply a handle
unless `showHandle={false}` or a direct handle is already provided. Add centered
`maxWidth` constraints and complete detached/floating layouts.

Add composable List collections with explicit browse/selection modes, stable keys,
controlled selection, optional bulk actions, leading/trailing content and loading/
empty states. DataTable gains the same mode contract, independently configurable
toolbar/filter/sort/pagination controls and responsive filter/sort bottom sheets.
MultiSelect adds a compact summary presentation used by typed table filters,
matching Select surfaces and height while preserving keyboard and form behavior.
Existing `selectable` behavior remains the fallback when mode is not specified.

Add contrast Input/Textarea/NumberInput variants, number text alignment, additional
Stepper layouts and retained panels, Card variants/size/selection/asChild support,
and grouped Progress allocations with colors, legends and accessible value text.
Progress segment values take precedence over value; over-capacity allocations
scale proportionally without exceeding the track.

Alerts gain appearance, action and dismissal slots. Toasts now default to a neutral
surface and a close button; `invert={true}` and `closeButton={false}` restore the
previous presentation. Keep the original neutral theme tokens and application-owned
content; no application-specific cards, storage, or message schema is introduced.
