# Shared component tooltip prop

Validated after `7169a95` on 2026-11-21, with a pending minor Changeset for
`@plain/ui`. The local package remains 0.2.0. No npm publication or deployment
is implied.

Rendered P.UI components and compound triggers accept `tooltip="Context"`, a
React node, or a typed `TooltipOptions` object. Options include content, placement,
alignment, offsets, collision handling, delay, controlled/default open state,
callbacks, disabled state, native content attributes, styles and unstyled behavior.
`PlainProvider.tooltip` supplies inherited defaults. Explicit `TooltipProvider`
scopes also coordinate the skip-delay period between neighboring triggers. The
existing compound tooltip API remains available.

The adapter preserves native props, refs, values, handlers, event cancellation and
existing accessible descriptions. It does not replace a control's checked/active
data state. Plain tooltip text supplies a fallback name for an unnamed icon button;
rich content can supply `label`. Disabled actions retain native disabled behavior
with a focusable explanation target and their original name/description. Enabled
controls retain their layout boxes. The nearest nested hint takes priority without
stopping consumer event propagation. Keyboard focus opens after native scrolling
has settled; Escape dismisses without moving focus. Touch taps remain actions.

Tooltip behavior loads separately and adopts the existing DOM anchor, keeping the
control mounted during loading. Optional-module failures leave native controls
usable. Components without a configured hint keep the original rendering path. The existing
tooltip content/arrow and new disabled-trigger styling slots, tooltip tokens,
theme portals, RTL and motion policies remain available. Default neutral tokens
and dependency versions are unchanged.

Supported surfaces include controls, typography, layout/presence, AspectRatio,
collections, table controls and rendered compound parts. Logical providers/roots
have no anchor; use their trigger. Chart families retain their existing plotted
data-tooltip API; `Chart` or another rendered container supplies contextual hints.
Structural chart axes, SelectValue and Toaster are not contextual hint targets.
The README, tooltip documentation and working preview show the prop. Shared docs
icon buttons, table pagination and calendar toolbar icons use library hints.
Breadcrumb ellipses have a named image role for valid accessible labeling.

Validation:

- All 387 repository tests passed: 9 infrastructure, 372 library and 6 docs tests,
  using `--concurrency=1 -- --testTimeout=15000 --maxWorkers=1`. The library total
  includes 15 tooltip tests. TypeScript, ESLint, workspace boundaries, formatting,
  Changesets status, library/docs builds and pack dry-run passed.
- Installed package verification compiled 106 documented examples and checked
  React 18.3.1/19.3.0 server rendering, public exports, native tooltip trigger
  attributes and absent leaked tooltip configuration. The refreshed docs archive
  contains 279 files and is 605,600 bytes. Button/layout eager gzip measurements
  are 19,512/17,776 bytes, below their unchanged 25 kB budgets. Deferred tooltip
  graphs are measured separately at 20,171/21,071 bytes; static-import graph checks
  ensure the optional tooltip engine is not eagerly retained. Existing heavy
  feature exclusions remain enforced.
- Chrome 157.0.8103.79 passed 16 tooltip scenarios against compiled package/docs
  code: native forms/ref focus, handler cancellation, disabled explanations, hover
  grace/dismissal, offscreen focus, Select/Tabs/Slider state, dialog/popover
  triggers, date/time/PIN/file controls, SVG QRCode, external table controls,
  AspectRatio/presence/breadcrumb targets, standalone defaults, unstyled hints,
  touch and an intentionally aborted tooltip module. Live hint toggles retain
  native state. No native `tooltip` attribute leaked into the page.
- Scoped Axe WCAG A/AA audits reported no violations at 1440px light/LTR/system
  motion, 1280px dark/RTL/reduced motion, 390px dark/RTL, 320px light/LTR and 640px
  with 200% root text sizing. Custom tooltip tokens and theme portal ownership
  were verified, with no document overflow or page errors. Desktop, dark/RTL and
  narrow-phone screenshots were visually inspected. These are Chromium emulation
  and text-reflow checks, not physical-device or browser-zoom certification.
- Twenty existing core browser scenarios also passed against compiled code,
  covering theme overrides, controls, ScrollArea, dialogs and mobile panels.
  Three stale assertions were aligned with the already-established inverted toast
  surface and token-search placeholder; all three passed their focused rerun.

Evidence is in `.preview/tooltip-all-tests-verified.log`,
`.preview/tooltip-{typecheck-final,unit-final,lint,format-check,changesets,package-final,docs-build-final}.log`,
`.preview/tooltip-verified-browser.log`, its HTML report/results directory,
`.preview/tooltip-compiled-final-browser.log` and `.preview/tooltip-core-recheck.log`.
Physical devices, Safari, screen readers and remote CI were not verified here.
