# Stationary button feedback

Integrated after `2a6625f`, with a pending patch Changeset for `@plain/ui`.
The manifest remains the local 0.2.0 candidate; no npm publication is implied.

Default buttons no longer lift on hover or shrink while pressed. Variant color,
opacity/filter feedback, focus outlines and native disabled/loading behavior are
retained. The shared geometry rules and their reduced-motion exceptions were
removed; application-supplied transforms remain available. No API or token changed.

ESLint/workspace boundaries, TypeScript, Prettier, build and package validation
passed. The existing library contract suite passed 29 tests. Package validation
compiled 103 examples, checked exports/CSS and peer SSR, and retained the Button-only
bundle at 20,020 bytes gzip within its 25kB budget.

Chrome 157.0.8103.79 checked the compiled Button preview at 1440px light/LTR with
system motion, 390px dark/RTL with system motion, and 1440px with motion disabled.
All eight preview controls retained their position/size across sampled hover and
held-pointer states. All six enabled variants retained visual hover feedback;
keyboard focus and held-Space geometry also passed. The loading/disabled controls
remained disabled. Local evidence is in the ignored
`.preview/button-feedback-browser.json` file. Other engines and physical devices
were not exercised in this task.
