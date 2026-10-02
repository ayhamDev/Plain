---
'@plain/ui': minor
---

Add nested LanguageProvider/TranslationProvider dictionaries, typed message overrides, locale-aware formatting, and English/Arabic internal component messages. Keep the neutral P.UI theme independent of language.

Add Chips, SearchView, an optional Kanban entry point, virtualized Gantt and heatmap charts, and Pie, Radar, Scatter and Composed chart wrappers. Extend typed table filtering with simple column chips, advanced filter rules, abortable remote requests, controlled server pagination/sorting/filtering, sticky table sections and synchronized horizontal scrolling. Chart data alternatives now compose the shared Table primitives.

Add input variants, floating/detached Sheet configurations, configurable bottom navigation and responsive Resizable panels. SplitPane exports and split-pane.* style overrides remain compatibility aliases; new code should use Resizable and resizable.* slots. DOM data-ui identifiers for these panels now use resizable.

Fix token-based input borders, empty-state alignment, collapsed sidebar layout, full-row tree expansion, overlay/step transitions and floating ScrollArea layout. Add opt-in elastic scrolling and async pull-to-refresh without reserving scrollbar space.

Cache calendar date formatting, event indexes and time-slot labels. Use primary semantic tokens for events and isolated printable views. Export CalendarEventDialog as an optional, composable editor rather than embedding application-specific event creation in FullCalendar. Applications retain event persistence and validation ownership.
