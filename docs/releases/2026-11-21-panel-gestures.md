# Safe content dragging in sheets and drawers

Integrated after `3cecab7`, with a pending patch Changeset for `@plain/ui`.
The local package remains 0.2.0. Validation date: 2026-11-21.
No npm publication or deployment is implied.

Sheets and drawers now default to content dragging (`handleOnly={false}`).
Headers, padding and plain areas can move the panel. Pointer initiation is
filtered before Vaul captures the pointer, so controls, slider tracks, editable
regions, links, focusable widgets and nested scrollers retain their gestures.
Mouse drags on paragraphs/code select text. Custom widgets can opt out with
`data-vaul-no-drag`; `handleOnly={true}` preserves the explicit handle restriction.

One real dialog node retains its refs, native props, pointer callbacks and styling
slots through an asChild boundary. Caller pointer-down cancellation is respected.
Collapsed selection left by autofocused inputs is cleared before engine drag
checks. Actual prose selections keep priority over body dragging. Touch direction and scroll
ownership are decided before panel movement; scroll positions are sampled at
gesture start, and native scrolling is retained. Vaul still owns drag physics,
snap points and dismissal. No dependency or public export was added.

Production CSS also suppresses Vaul's decorative child tail with a stronger
selector. The injected engine selector previously tied the bundled selector and
could recreate a three-panel-height scroll extent after scripts loaded. That
invisible overflow interfered with gesture arbitration. Attached panels retain
their separate background continuation; bounded/floating gaps remain intentional.
Documentation, examples and playground defaults describe the new behavior.

Validation:

- All 361 tests were verified across full and focused runs: 9 infrastructure,
  346 library (including 5 new gesture tests) and 6 docs tests. The full run hit
  seven five-second timeouts in two calendar test files; all 46 tests in those
  files passed in isolation with one worker and a 15-second CLI allowance.
  Repository timeout settings were not changed.
- Workspace TypeScript, ESLint, dependency boundaries, formatting, Changesets
  status, library/docs builds and package-content checks passed. Installed-package
  verification compiled 106 examples and checked React 18.3.1/19.3.0 server
  rendering. The archive contains 257 files and is 570,175 bytes. Button/layout
  gzip sizes remain 17,445/15,787 bytes.
- Chrome 157.0.8103.79 passed 29 final gesture browser scenarios: mouse/touch
  body dragging on every edge for Sheet and Drawer, slider thumbs/tracks,
  vertical sliders, textarea scrolling, prose selection, root/nested scrolling,
  explicit restrictions, native refs, keyboard dismissal, RTL and focus return.
  Separate runs passed existing snap/elastic/background, mobile filter and time
  picker regressions. An added late-injected CSS test and ten associated panel
  background/gap cases passed after the production cascade fix.
- Production examples passed at 1440x1000 light/LTR, 720x1000 dark/LTR,
  320x1000 light/LTR and 390x1000 dark/RTL, using system/none motion. They checked
  sheet/drawer padding drags, slider isolation, editing, actions, focus return,
  short-drawer scroll extent, horizontal overflow, scoped Axe WCAG A/AA checks
  and page errors. Screenshots were visually inspected. One RTL probe initially
  landed in Chrome's expanded close-button touch target; the final padding probe
  stays clear of controls.

Evidence is in `.preview/panel-gestures-qa`, the `.preview/panel-gestures-*report`
folders and logs with that prefix. Production results are in
`.preview/panel-gestures-qa/production.json`. Touch uses Chrome/CDP emulation;
physical devices, Safari, screen readers and remote CI were not verified here.
