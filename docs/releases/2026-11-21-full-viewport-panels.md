# Full viewport Sheet and Drawer panels

Package fix for `@plain/ui`, validated locally on 2026-11-21. A patch Changeset
records the consumer change; no registry publication or deployment was performed.

`size="full"` now covers both viewport dimensions on every physical side,
including detached and floating panels with root/content width limits. Full
viewport snap points remove detached gaps and cross-axis width constraints as
they expand. Corners flatten over the final 64px of travel and return on collapse,
following Vaul's actual pointer transform and snap animation. Safe-area padding,
scrollable content, native refs, callbacks and reduced-motion behavior remain.
Custom-container full panels fill their positioned container. Long mobile picker
sheets can reach `100dvh` instead of stopping at 90-92% height.

The internal viewport observer caches dimensions on resize and writes a CSS
radius scale without per-frame React state. It samples only active transform
animations or engine mutations and disconnects on cleanup. Full detached/floating
panels also retain the existing sibling background continuation during overdrag.
The Sheet snap-point example now includes a full-height snap.

Validation:

- All 417 repository tests passed: 9 infrastructure, 402 library and 6 docs tests.
  The final command was `npm test -- --concurrency=1 -- --maxWorkers=1` with the
  existing test deadlines. Earlier parallel calendar/mobile tests exceeded those
  deadlines under local CPU contention; both focused serial reruns and the full
  single-worker run passed without changing implementation or test timeouts.
- Eighty Chrome 157.0.8103.79 scenarios passed against compiled package/docs code:
  20 new viewport scenarios and 60 existing panel overflow, gesture arbitration
  and mobile picker scenarios. Coverage includes all four physical sides of both
  components, 320px and 390px phones, short landscape viewports, desktop, light/dark,
  LTR/RTL, custom 32px corners, root/content width limits, 40px detached gaps,
  partial/full snaps, intermediate animation frames, mouse and CDP touch dragging,
  long-content scrolling, focus restoration, reduced motion, rotation, custom
  containers and pixel continuity during overdrag. Relevant automated Axe checks
  passed. Full-size desktop and narrow dark/RTL captures were visually inspected.
- Installed-package verification compiled 106 documented examples and the consumer
  fixture. Node/SSR checks passed with React 18.3.1 and 19.3.0. The refreshed docs
  archive contains 291 files and is 626,149 bytes. Eager Button/Layout gzip remains
  19,512/17,776 bytes, below the unchanged 25 kB budgets; heavy-feature exclusions
  remain enforced.
- TypeScript, ESLint, library/docs builds, workspace boundaries, formatting,
  Changesets planning, diff checks and package dry-run passed. Private logs and
  screenshots are under `.preview/full-panels-*`.

Chrome touch and viewport checks use emulation. Physical-device, screen-reader,
other browser-engine and remote CI testing were not performed in this local run.
