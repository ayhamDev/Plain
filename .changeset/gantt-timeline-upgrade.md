---
'@plain/ui': minor
---

Upgrade GanttChart with grouped date headers, weekend shading, a Today marker and
navigation, controlled/uncontrolled day/week/month zoom, an optional task column,
short-bar label placement, accessible task details and rounded dependency arrows.
Short timelines fill the available width unless dayWidth supplies a fixed size.
Keep P.UI's neutral tokens; add typed Gantt slots and weekend/bar/today/dependency
token aliases. Expose GanttScale from the charts entry.

Add pointer movement and start/end resizing when onTaskChange is supplied. Edits
snap to days, commit once on release, preserve task data and cancel with Escape.
Keep existing keyboard editing and exclusive end dates. Small bars have enlarged
hit areas without changing their drawn duration; resize grips appear when bars
are wide enough to leave room for distinct targets. Other tasks are editable by
keyboard or after zooming in. Dependency scheduling remains application-owned.

New styled defaults use 48px rows (previously 44px), a 72px grouped header,
three-day padding on implicit range edges, a toolbar and task details. Explicit
start/end bounds remain exact. Use rangePadding={0}, rowHeight={44},
showToolbar={false} or showTaskDetails={false} where the former configuration is
needed; disable details when the application owns a task dialog.

Keep row/date virtualization, stable measurement keys, and a memoized complete
P.UI Table alternative including dependency names. Opt out of the built-in table
when supplying a paginated alternative for very large datasets. Document new
props, correct the demo source, and add interaction, date-boundary and large-range
regression coverage.
