# Production imports and rendering

0.3.0 splits implementations by component while preserving the root and grouped
entry points. Every declared runtime entry is built and tested for identity with
the root/chart exports. Internal components import their specific siblings rather
than a family barrel. Chart wrappers inject their own engine and series renderer;
time-only controls do not import the month-calendar renderer.

## Import a component

```tsx
import { PlainProvider } from '@plain/ui/provider';
import { Input } from '@plain/ui/input';
import { NumberInput } from '@plain/ui/number-input';
import { TimePicker } from '@plain/ui/time-picker';
import { BarChart } from '@plain/ui/bar-chart';
```

Root and grouped imports remain tree-shakeable and are checked against the direct
equivalent. Narrow imports also reduce the module graph a development tool must
traverse. Avoid namespace imports used dynamically, since they can retain an entire
entry. Do not import undocumented implementation files under dist. Charts,
scheduling, Kanban and the Motion wrapper remain optional entries.

## Choose compiled styles

The complete `@plain/ui/styles.css` is still supported. For a smaller entry,
import `@plain/ui/core.css` once and add the applicable features below. These are
precompiled styles; applications need neither Tailwind nor a CSS generator.
Choose one foundation, rather than importing both styles.css and core.css.

| Component/workflow                                                                                                       | CSS after core.css                                                   |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Button, Input, Checkbox, Switch, Slider, Card, feedback, layout, menus, sheets                                           | None                                                                 |
| Number/Search/Password/PIN/Phone/Tags inputs, Select, Combobox, MultiSelect, file upload, Dropzone, ColorPicker, Command | inputs.css                                                           |
| List, Item                                                                                                               | collections.css                                                      |
| Calendar, DatePicker, date/time/range controls and time wheels                                                           | inputs.css + calendar.css                                            |
| Sidebar/AppShell                                                                                                         | sidebar.css; add inputs.css for command/search/choice controls       |
| DataTable with standard controls                                                                                         | inputs.css + data-table.css; add calendar.css for date filter fields |
| QRCode                                                                                                                   | qr-code.css                                                          |
| Recharts, heatmap, Gantt                                                                                                 | charts.css; add inputs.css + calendar.css for Gantt date controls    |
| FullCalendar with its editor                                                                                             | inputs.css + calendar.css + full-calendar.css                        |

For example:

```tsx
import '@plain/ui/core.css';
import '@plain/ui/inputs.css';
import '@plain/ui/calendar.css';
```

Core CSS is 21.6 KiB gzip versus
32.6 KiB for the complete stylesheet. Feature CSS
has its own cost: inputs 4.6 KiB, calendar
4.3 KiB, collections
1.3 KiB. Use the complete stylesheet when
most groups are needed. It compresses overlapping rules together and preserves
the original full-library cascade. Feature styling tokens and unstyled mode are
unchanged; verify scoped portals and application overrides when selecting CSS.

## Measurements

Compared with the pinned 0.2.0 checkout `c479dbbee28a0248c6fb834291c01f5a03f6dc28`, using its own compiled
package and dependencies. Both probes use Vite 8.3.1 production-minified ESM,
include engine dependencies, externalize React/ReactDOM, and exclude CSS from JS.
Values are KiB (1024 bytes), gzip of concatenated eager or deferred chunks.
They are isolated-component costs, not additive application totals. Shared
dependencies are deduplicated when components are bundled together.

| Entry          | 0.2 eager | 0.3 eager | Reduction | 0.3 deferred |
| -------------- | --------: | --------: | --------: | -----------: |
| Button         |      19.2 |      15.7 |       18% |         20.5 |
| Input          |      64.9 |      13.4 |       79% |         20.6 |
| Badge          |      19.4 |      13.6 |       30% |         20.6 |
| Card           |      22.1 |      16.3 |       26% |         20.5 |
| Spinner        |      25.6 |      21.0 |       18% |         20.6 |
| Checkbox       |      64.9 |      19.7 |       70% |         17.6 |
| Select         |      66.1 |      56.3 |       15% |         21.7 |
| NumberInput    |      95.1 |      22.0 |       77% |         20.6 |
| Combobox       |      85.5 |      69.7 |       18% |          4.9 |
| MultiSelect    |      95.1 |      66.3 |       30% |          4.9 |
| Dialog         |      77.7 |      34.7 |       55% |         15.9 |
| Sheet          |      78.3 |      49.1 |       37% |         15.9 |
| Toast          |      83.0 |      29.3 |       65% |         20.5 |
| Tabs           |      49.3 |      25.4 |       49% |         17.6 |
| ScrollArea     |      49.3 |      33.8 |       31% |         18.4 |
| Layout         |      17.5 |      17.3 |        1% |         20.5 |
| PlainProvider  |      24.8 |      24.9 |        0% |          0.0 |
| Calendar       |     124.7 |      82.4 |       34% |         21.7 |
| TimePicker     |     155.0 |     114.9 |       26% |          5.3 |
| DateTimePicker |     155.0 |     131.1 |       15% |          5.3 |
| DataTable      |     176.4 |     153.8 |       13% |          5.3 |
| VirtualList    |      29.1 |      28.9 |        0% |         20.5 |
| Sidebar        |     108.8 |      80.7 |       26% |          1.4 |
| QRCode         |      33.8 |      33.6 |        1% |         20.6 |
| PhoneInput     |     168.3 |     160.0 |        5% |          4.9 |
| BarChart       |     182.0 |     158.7 |       13% |         20.5 |
| Heatmap        |      34.2 |      30.8 |       10% |         20.6 |
| Gantt          |     138.9 |     103.0 |       26% |         21.4 |
| FullCalendar   |     102.8 |      92.0 |       10% |         21.4 |

Deferred code is emitted but not eagerly imported: it includes optional tooltips,
theme generation and Select's Sheet engine where relevant. The
[machine-readable report](0.3.0-bundles.json) also records total gzip and the sum
of independently compressed chunks (transferGzip), so these costs remain visible.
The phone entry retains full phone-number metadata and native form/validation
behavior; virtualization reduces mounted rows rather than metadata bytes.

The production gate checks 126 runtime entries, 29 direct/root-or-grouped
bundle pairs and 11 CSS exports. It rejects unrelated select/slider/radio,
calendar, chart and overlay engines in selected consumer probes. Limits live in
[tooling/bundles/cases.mjs](../../tooling/bundles/cases.mjs).

```sh
npm run check:bundles
```

The detailed local result is written to .preview/bundles/report.json. Re-measure
with the application's bundler, production routes and real content before making
an application budget claim; installation size and emitted sourcemaps do not
represent browser transfer size.

## Runtime behavior

- Responsive controls share one native media-query listener per window/query and
  release it when the last consumer unmounts. Fixed presentations and fixed virtual
  column counts do not subscribe. The inactive-query cache is bounded.
- Unchanged default StyleProvider settings keep their context identity, avoiding
  a context broadcast to memoized children on an unrelated parent render.
- Phone country options use TanStack Virtual, measured rows and small overscan.
  Search ranks the complete data set; keyboard navigation and selected-country
  scrolling work beyond the mounted window. The active descendant stays mounted.
- Theme-color generation and tooltip behavior retain lazy boundaries. Select loads
  the original Sheet implementation only on first sheet presentation. The native
  selection/form engine remains the same in either presentation.
- Keep table data/columns stable, use remote operations for large server datasets,
  and choose chart data alternatives deliberately. Virtualization does not reduce
  downloaded records or make unbounded application work inexpensive.

Browser evidence covers compiled desktop/mobile layouts, touch and wheel scrolling,
RTL, localized names, focus, gestures and motion policy. It does not establish
physical low-end-device timings or assistive-technology certification.
