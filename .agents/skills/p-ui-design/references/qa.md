# Browser QA for P.UI

Use the repo's existing checks and browser tooling; choose scenarios around the
behavior changed. Check an installed/packed consumer when exports, CSS, SSR, or
engine integration changed. Do not treat the documentation app alone as evidence
that package consumption works.

## Inspect Actual States

- Exercise the primary workflow with realistic long labels, localized text,
  loading, empty, error, disabled, and selected states. Confirm native form
  submission, validation, and ref focus when changing a control or wrapper.
- Inspect screenshots at a narrow phone width (including 320px when supported),
  a normal mobile width, and a wide desktop width. Check 200% zoom/reflow, content
  clipping, horizontal document overflow, and fixed navigation covering actions.
  Wait for fonts and lazy components before visual inspection.
- Check light/dark and LTR/RTL, including open overlays. For theme changes also
  check neutral and custom colors, scoped portals, CSS overrides, and unstyled
  composition. Inspect borderless controls, error/focus contrast, and selected
  states; generated colors are not an accessibility certificate.
- Use keyboard-only traversal: initial and restored focus, Tab order, arrows in
  composite controls, Escape, disabled items, and trap behavior in modal overlays.
  Keep focused controls visible during scroll, route changes, and virtualization.
- Exercise system preference changes and reduced/none motion. Completion,
  dismissal, and focus must work without waiting for an animation event that
  never fires. Avoid hidden content after transitions are disabled.

## Domain Checks

- Charts: visible plotted data, nonzero dimensions after resize/tab reveal,
  keyboard/tooltips, named units, and the data alternative. Inspect rendered
  SVG/canvas content as well as screenshots when diagnosing blank media.
- Virtual layouts: resize, scroll to both ends, dynamic row heights, stable keys,
  selection and focus outside the initial window, and the nonvirtual alternative.
- Dates: locale and RTL navigation, leap day, month/year boundaries, allowed
  ranges, clearing, and timezone/daylight-saving cases relevant to the product.
- Mobile overlays: opening, closing, input focus, long scroll content, and drag
  dismissal where supported. Emulation cannot prove physical keyboard/gesture
  behavior; record real-device coverage separately.

Run automated accessibility checks on the meaningful states, and inspect focus,
contrast, labels, and reading order. Record browser/version, viewport, scenario,
result, and evidence location. Screen-reader checks, physical-device checks, and
remote CI results must be reported separately and only when actually performed.
