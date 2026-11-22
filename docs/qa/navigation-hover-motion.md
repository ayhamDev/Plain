# Hover navigation motion

Validated locally on **November 22, 2026**, on the working tree based on
`42bde50`. This fix has a pending patch Changeset; no version bump or publication
is included.

## Changes and diagnosis

Rail labels previously wrapped while the panel was narrow: a default row could
grow from 40px to 216px before shrinking to its final size. On collapse, icons
also jumped back to a centered compact layout immediately. Expandable rails now
keep the same row layout throughout, with single-line labels and stable icon
positions. The selection indicator follows the container width directly instead
of animating toward successive resize measurements.

Closing overlays previously lost their raised stacking layer before the backdrop
finished fading. The layer is now retained through the transition. Width, shadow
and backdrop share the standard easing and slow duration; text and header slots
fade in sequence. Sidebar inputs, badges and actions reveal without an abrupt
appearance. Returning during an active closing width transition resumes the
preview immediately; a fresh hover still honors its configured delay.

These transitions use CSS. The pointer-entry handler checks the existing width
transition once; no animation loop, layout sampling loop, dependency or public
prop was added to the runtime. Reduced-motion settings and unstyled composition
remain supported.

## Verification

| Check                                                | Result                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| Navigation, theming and workspace unit tests         | 39 passed                                                         |
| Typecheck, lint, workspace boundaries and formatting | Passed                                                            |
| Library and documentation production builds          | Passed                                                            |
| Packed consumer                                      | Passed: 108 public examples, 704 files, React 18.3.1 / 19.3.0 SSR |
| Compiled browser suite                               | 34 passed, including 10 new motion cases                          |
| Compiled source identity                             | Sidebar and navigation-expansion maps matched the final source    |

Chrome **157.0.8103.79** on Windows. Motion cases sample opening and closing in
inline/overlay modes and LTR/RTL, checking stable row heights, row positions,
icons, label heights, indicator width and overlay stacking. Rapid reversals
preserve the mounted panel. Existing cases cover keyboard pinning and Escape,
portaled menus, local backdrop paint, reduced motion, oversized panels, floating
variants, long-menu scrolling, 48px/64px compact sidebars, 320px/390px mobile sheets
and accessibility scans. Default expandable rail rows remained 44px throughout;
labels remained one line, and icon shifts stayed within one CSS pixel.

Physical-device, screen-reader and hardware frame-rate measurements were not
performed. Local browser sampling establishes layout/layer continuity, not a
guarantee of a particular frame rate on every device. Remote CI was not observed.

The released `plain-ui-0.3.0.tgz` was preserved unchanged after temporary candidate
packing (SHA-256
`564f02de2160232f57d8d9a45426c44489c4334e0e34375d4d621930cfdc0e84`).

## Reproduction

```sh
npm run test --workspace=@plain/ui -- tests/navigation-expansion.test.tsx tests/theming.test.tsx tests/workspace-upgrade.test.tsx --maxWorkers=1
npm run test:e2e -- tests/e2e/navigation-motion.spec.ts tests/e2e/navigation-expansion.spec.ts tests/e2e/sidebar-overflow.spec.ts --workers=1
```

The browser command defaults to development. Local production verification used
`.preview/navigation-qa.config.mjs` and an isolated preview, with
`PLAYWRIGHT_BASE_URL` pointing at it. Git-ignored evidence includes
`.preview/navigation-motion-validation.json`, the corresponding check logs,
`.preview/navigation-motion-production-tests.log`, sampled geometry attachments
and screenshots under `apps/docs/test-results`. The normal docs server on port
5173 was preserved.
