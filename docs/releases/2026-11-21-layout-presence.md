# Layout presence

Integrated after `efd1615`, with a pending minor Changeset for `@plain/ui`.
The manifest remains the local 0.2.0 candidate; no npm publication is implied.
Local validation completed on 2026-11-21.

Layout containers now accept an opt-in `presence` option for direct keyed
children. The shared API covers Box, Flex, Stack, Inline, Grid, Container, Center,
Spacer, Masonry, Resizable/ResizablePanel, Card and its layout sections,
AspectRatio, ScrollArea, sidebar containers, AppShell main content, tab/disclosure
content and native table row groups. `LayoutPresence asChild` applies the same
behavior to another native/ref-forwarding container without a DOM wrapper.
Stable keys must identify single DOM roots; unsupported geometry skips animation
and still removes content. Engine-owned open/close and virtualized-window
lifecycles retain their existing responsibilities.

Options cover first-render animation, fade/slide/scale presets, entrance/exit
duration, easing, slide distance, staggering, optional position animation, a
concurrency limit and an exit-completion callback. Durations are milliseconds and
inherit normal/fast motion tokens. Stagger delay is capped at 200ms. The default
limit of 50 applies across overlapping batches and retained exits. Extra content
appears/removes immediately rather than queuing unbounded work.

React retains keyed elements and their local state until exit completes.
Reintroduced keys cancel their exit and restore native attributes. Exiting
elements become inert and hidden from assistive technology; native fields are
disabled until removal, so they cannot submit stale values. Focus moves out of a
removed subtree, with the temporary focus target restored after blur. Native
animation completion and a bounded timer both release retained elements.
Reduced/none motion, zero duration and unavailable animation support skip delay.
Server HTML stays visible, including React 18/19 SSR.

The frame path uses the [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API).
There are no per-frame React state updates, scroll listeners, persistent
will-change styles or geometry measurements in the default fade path. Optional
reflow batches geometry reads on child changes. Static layouts do not subscribe
to motion preferences or perform animation/geometry work. Enabled consumers
share one system preference listener. Native props, refs, typed existing slots,
unstyled composition, scope tokens, neutral colors and RTL remain available.
The optional `@plain/ui/motion` engine keeps its separate API and second-based
transition values.

The resize implementation moved behind its existing layout exports so simple
layout imports exclude that engine. Pure component factories preserve DevTools
display names while allowing unused card/presence code to leave Button-only
bundles. The installed-package verifier now enforces that boundary and a 25kB
layout bundle budget. No dependency, CSS styling slot or palette was added.

The layout guide has a live add/remove/reorder example, preset selection,
first-render switch and entrance replay. The README, API tables and packed
consumer document shared options and custom semantic containers.

Validation:

- Library/docs builds, installed-package verification, TypeScript, ESLint and
  workspace boundary checks passed. The final pack dry run and Changesets plan
  passed; formatting was checked after the last documentation/test edits.
- All 344 automated tests passed with `npm test -- --concurrency=1`: 9 workspace
  checks, 329 library tests and 6 docs tests. The new lifecycle suite contains
  40 cases, covering
  cancellation, batched completions, overlapping limits, native forms and refs,
  focus, reduced motion, shared listeners, StrictMode, unsupported geometry,
  SSR, semantic asChild composition and container integrations.
  The existing pending-clear time-picker regression now dispatches clear in the
  same JavaScript turn so CPU load cannot settle the gesture before the action.
- Eighteen Chrome 157.0.8103.79 presence scenarios passed across development runs.
  Four exercise first render, insertion, removal, reentry, preserved input state,
  submission exclusion, position animation and focus at 1440px light/LTR, 800px
  dark/LTR, 320px light/LTR and 390px dark/RTL. Ten exercise native structure and
  retained real elements across container types, including table, list, scroll
  area, sidebar and resizable content. The remaining cases cover large batches,
  provider/system reduction and missing animation support. Applicable scoped Axe
  WCAG A/AA scans passed. The resizable fixture uses the engine's stable group ID.
  The batch case was also rerun with another insertion during active entrances
  before clearing 81 items, confirming the six-animation cap across updates.
- Five production cases passed at those four profiles plus 640x450 CSS pixels
  with 2x scale. Each exercises add/remove/reorder, focus restoration, the slide
  preset, first-render opt-out and live reduced motion. All-rule scoped Axe scans,
  horizontal overflow checks and page-error checks passed. Sampled desktop,
  narrow-phone and dark/RTL screenshots were visually inspected.
- Four existing time-wheel cases passed: native touch/wheel scrolling at 320px
  light/LTR, 390px dark/LTR and 390px dark/RTL, plus reduced motion/forced colors.
- The verified archive contains 245 files and is 543,275 bytes. All 106 public
  examples and the modular consumer compile. SSR passes with React 18.3.1 and
  19.3.0. The Stack/Grid/LayoutPresence bundle is 15,787 bytes gzip and excludes
  Motion, resize, chart and table engines. Button-only is 17,445 bytes gzip,
  below its prior 17,601-byte baseline, and excludes layout-presence code. Both
  bundles pass their 25kB budgets. The docs download archive was refreshed.

Evidence is in ignored `.preview/presence-qa/` and `.preview/presence-*.log`.
Physical devices, other browser engines, screen-reader sessions, hardware frame
profiling and remote CI were not tested. The 2x case emulates effective reflow
size/scale rather than operating the browser zoom control.
