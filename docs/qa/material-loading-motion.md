# Material loading motion correction

Validated locally on **November 24, 2026**, against the working tree based on
`ada020e`. A pending patch Changeset records this correction; the package remains
0.3.0 and no release was published.

## What changed

The initial loader normalized each contour independently and continuously morphed
between them while rotating at a constant speed. This changed their proportions
and missed the reference's spring turn and settling rhythm.

The corrected loader preserves Chesai's seven original cubic outlines in their
48-unit coordinate system, with one uniform scale. Feature-matched endpoint
samples handle the short morph; the exact cubic outline is displayed during the
settled part of each step. Matching was performed during authoring with the
reference project's existing Flubber installation. Neither Flubber nor a Motion
runtime is imported by the shipped loader. The Chesai notice remains in
THIRD_PARTY_NOTICES.md.

Motion combines a spring-driven quarter turn with a separate slow rotation. The
reference cadence is 650ms per shape, spring stiffness 200 / damping ratio 0.6,
and a 4666ms global rotation. The default seven-shape cycle is 4550ms. Reference
sources are the official [Compose loading indicator](https://github.com/androidx/androidx/blob/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/LoadingIndicator.kt)
and [Android animation delegate](https://github.com/material-components/material-components-android/blob/master/lib/java/com/google/android/material/loadingindicator/LoadingIndicatorAnimatorDelegate.java).

Native SVG timelines use cached samples and splines, without per-frame React
updates. Four shape cycles make 28 quarter turns, keeping that rotation's repeat
boundary continuous. Custom duration scales the whole choreography together.
Pause/resume preserves the clock position. Server rendering and reduced/none
motion retain a visible original contour and localized status label.

## Verification

| Check                                              | Result                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------- |
| Focused library tests                              | 17 passed across animation geometry and existing expressive contracts     |
| Documentation tests                                | 6 passed                                                                  |
| Typecheck, lint and workspace boundaries           | Passed                                                                    |
| Library/docs builds and production browser fixture | Passed                                                                    |
| Packed consumer                                    | 753 files, 112 compiled public examples; React 18.3.1 / 19.3.0 SSR passed |
| Bundle gate                                        | 131 runtime entries, 34 direct/root pairs and 12 stylesheets passed       |
| Production browser tests                           | 10 passed                                                                 |

Chrome **157.0.8103.79** on Windows. The production tests cover 1440px light/LTR,
390px dark/LTR and 320px dark/Arabic RTL, long/custom provider messages, scoped
colors, keyboard focus, 200% reflow, pause/resume and system/provider reduced
motion. Automated axe checks passed in all three width/appearance scenarios.

Additional native timeline samples verify one visible contour throughout the
sequence, original curves during holds, spring overshoot, independent slow
rotation, and continuity at both repeat boundaries. Animated outline sampling
at 320px confirms that rotated contours stay inside the SVG. A side-by-side
render with the actual Chesai animation was reviewed, followed by a 30fps capture
of the corrected native timeline. The GIF is a short, single-play excerpt rather
than an artificial repeating animation.

The corrected LoadingIndicator measures **27,606 eager gzip bytes** by direct
import and **27,594** through the root, excluding React and CSS. The original
implementation measured 25,351 bytes. This approximately 2.3KB increase covers
the original cubic holds, matched morph geometry and native spring timelines;
its gate was deliberately changed from 27,000 to 28,000 bytes. Other budgets
were unchanged. The eager module audit contains no Flubber or Motion engine.

Physical devices, screen readers, Safari/Firefox and remote CI were not tested.
Other components were not reimplemented in this correction; the full library
suite results in the earlier expressive-feedback record remain historical.

Git-ignored evidence is in `.preview/material-loader-final-*.log`,
`.preview/material-loader-final-validation.json`,
`.preview/material-loading-bundle.json`, `.preview/loading-motion/` and
`apps/docs/test-results/`. The production fixture used the isolated 5234 preview;
the reference comparison used 5235. The user's docs server was left running.

The pre-existing documentation archive was restored byte-for-byte after temporary
packing and is excluded from this change (SHA-256
`82b0215ce072c19c1207c22e6c8b6feba65d036937aaab6d90da8baad27ff28b`).
