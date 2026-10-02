# Workflow Composition

Choose the surface by what users need to do, then choose the smallest suitable
primitive. Existing templates are starting compositions; adapt their information
architecture, copy, actions, and states to the product rather than reskinning them.

| Need                         | Prefer                                                | Watch                                                                         |
| ---------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| Compare many records         | Table/DataTable with relevant columns and row actions | Stable IDs, meaningful sorting, server ownership of filters/pagination        |
| Inspect and edit one record  | Master/detail or a route with a clear return path     | Preserve list filters, selection, and scroll position                         |
| Switch destinations          | Links and a navigation shell                          | Active destination and browser history; tabs are for peer views within a task |
| Choose a short value         | Select or native select                               | Use Combobox when search helps; label the trigger, not its non-DOM root       |
| Confirm a destructive action | AlertDialog                                           | Specific consequence, deliberate confirmation, safe initial focus             |
| Edit contextual details      | Dialog or Sheet                                       | Accessible title, explicit dismissal, focus return, unsaved state             |
| Show a mobile secondary task | Sheet/Drawer                                          | Reachable close control, keyboard-safe content, scroll and drag interaction   |
| Show a metric relationship   | Recharts-backed chart                                 | Units, time range, textual insight, accessible data alternative               |

## Mobile Navigation and Overlays

Use a persistent sidebar/rail for wider workspaces; use a compact header and
reachable navigation on narrow screens. Bottom navigation suits a small set of
primary destinations; a sheet suits secondary destinations and filters. Preserve
the same destination model across breakpoints. Respect safe-area insets and dynamic
viewport height; avoid nested competing scroll regions and fixed controls covering
form errors. Test the Back path and focus after route or overlay changes.

Sheet/Drawer use Vaul. Prefer root `side`: it wins over native physical `direction`,
then the legacy `SheetContent side` compatibility fallback. Logical start/end resolve
through RTL context before reaching the engine. Sheet defaults to end; Drawer to
bottom. Test placement, gestures, input focus, scrolling, and dismissal together;
engine support is not evidence of physical-device verification.

## Charts, Dates, and Large Data

- Retain Recharts' `accessibilityLayer` and test keyboard point navigation with
  custom tooltips. Provide a named chart, units, meaningful series labels, and
  an accessible table or data download. Do not encode meaning only in color, add
  every point to tab order, or assume every chart type has identical keyboard
  support. See [Recharts accessibility guidance](https://github.com/recharts/recharts/wiki/Recharts-and-accessibility).
- Give responsive charts a nonzero height and a shrinking parent (`min-width: 0`
  where needed). Recheck a chart first mounted in a hidden tab or resized panel.
  Verify loading, empty, single-point, negative, and missing-data states.
- Use DayPicker for date selection, Temporal-backed native date/time controls,
  and the opt-in FullCalendar engine for event scheduling. Date-time picker values
  remain wall-time strings: a timeZone validates/formats them, not an implicit UTC
  conversion. Date picker ranges are inclusive; event-calendar ends are exclusive.
  Define timezone and daylight-saving policy before converting to an instant. Native
  editor appearance varies by browser/device. Use `Intl` and the installed engines,
  not a handmade calendar or parser.
- Virtual lists/grids need a bounded scroll container, stable item keys,
  measurement for changing row heights, deliberate focus retention, and absolute
  row positions/counts for accessible grids when supported. Do not promise browser
  find, print, or full screen-reader traversal of unmounted rows;
  offer pagination, export, or an unvirtualized view when the workflow needs them.
  Separate windowing from server data loading and verify RTL horizontal scrolling.

Use the opt-in charts/full-calendar entries with their matching CSS;
Motion uses its own entry and MotionProvider, with no extra stylesheet. VirtualGrid
uses fixed rowHeight; the list and masonry measure items. These wrappers expose
list semantics, not an ARIA grid. Inspect the current public props before composing.

Blocks and templates live in the documentation gallery. Copy their complete TSX
source into the application's own files and adapt it there. They are not package
exports or runtime registry components. Preserve native control props, use semantic
typography, and wire prototype actions to real services deliberately.
