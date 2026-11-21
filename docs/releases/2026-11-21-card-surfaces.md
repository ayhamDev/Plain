# Soft Card surface feedback

Integrated after `13e8977`, with a pending patch Changeset for `@plain/ui`.
The local package remains 0.2.0. Validation date: 2026-11-21.
No npm publication or deployment is implied.

Card hover previously forced a darker border and large shadow, including on the
ghost variant. Selection added another outline through a spread shadow. Those
states now use neutral surface tints derived from the existing card background
and foreground tokens. Hover, selection, selected hover and press have distinct
paint treatments. Each variant retains its resting frame/elevation; ghost stays
borderless. Feedback uses the normal duration and ease-out tokens without moving
or scaling the card.

Description text gains emphasis with the surface tint, preserving readable
contrast on the deeper states. Both background and description color transitions
follow the motion policy. Disabled controls do not receive hover/press feedback;
devices without hover capability avoid hover feedback. Keyboard-visible focus retains its outline.
Native button/link composition, inner actions, refs, presence, styling slots,
unstyled composition and local color overrides remain supported. No wrapper,
JavaScript animation, dependency, export or public prop was added. Public docs
explain the visual options and application-owned interaction/selection semantics.

Validation:

- All 361 tests passed against the final implementation: 9 infrastructure,
  346 library and 6 docs tests. The full run used
  `--concurrency=1 -- --testTimeout=15000 --maxWorkers=2`; repository timeout
  settings were not changed.
- Workspace TypeScript, ESLint, dependency boundaries, formatting, Changesets
  status, library/docs builds and package-content checks passed. Installed-package
  verification compiled 106 examples and checked React 18.3.1/19.3.0 server
  rendering. The updated archive contains 257 files and is 571,208 bytes.
  Button/layout gzip sizes remain 17,445/15,787 bytes.
- Chrome 157.0.8103.79 passed 17 final Card browser scenarios. They cover all four
  variants in light/LTR and narrow dark/RTL layouts, distinct surface states,
  constant borders/shadows/geometry, keyboard focus and Space activation, native
  disabled behavior, local colors, inner actions, unstyled links, reduced/none
  motion, touch without sticky hover and the existing Card playground controls.
  Additional checks held the selected cards pressed while auditing description
  contrast across all variants in both themes.
- The production docs example passed at 1440x1000 light/LTR/system motion,
  720x1000 dark/LTR/no motion, 320x1000 light/LTR/system motion and 390x1000
  dark/RTL/reduced motion. Checks covered ghost/lg idle, hover, selection,
  selected hover and press, readable descriptions, unchanged card dimensions,
  working inner actions, horizontal document overflow, page errors and scoped
  Axe WCAG A/AA checks. Screenshots were visually inspected, including the
  narrow and dark RTL examples.

Evidence is in `.preview/card-surface-final-*` logs, the
`.preview/card-surface-final-report` browser report and
`.preview/card-surface-qa/production.json` with production screenshots.
Touch uses Chrome emulation; physical devices, Safari, screen readers and remote
CI were not verified here.
