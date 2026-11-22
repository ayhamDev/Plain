# Selection sheet dragging and layout

Validated locally on **November 22, 2026**, on the working tree based on
`afe170d49717019433f974458b4acdc26ba85537`. The commit carrying this record contains
the verified changes. No version bump or publication is included; the patch has a
pending Changeset.

## Behavior

Select and the shared Combobox, MultiSelect and PhoneInput selection panel now
inherit the original Sheet's content-safe dragging instead of forcing
`handleOnly`. The handle, title, header and unused surface can initiate dragging;
inputs, options and scrollable lists retain their own gestures. Shared panels
initially focus the dialog or keyboard search without making the title a control.

Searchable sheets fit short results and cap long content to the available viewport.
Search focus outlines have room inside the clipping boundary. Lists have inset
padding, and close/Done targets are at least 44px. Multiple selection remains open
until dismissal or Done, preserving the original form and ref.

Select sheets omit the popover scroll arrows that were shifting their height.
They also suppress Radix's item-aligned popup expansion handler while preserving
native scrolling. Home, End and typeahead keep focused options fully visible.
Popover mode retains its normal arrow controls and positioning behavior.

## Verification

| Check                                    | Result                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| UI regression tests                      | 47 passed across selection surfaces, panel gestures, phone input and mobile pickers   |
| Documentation tests                      | 6 passed, including public example compilation                                        |
| Typecheck, lint and workspace boundaries | Passed                                                                                |
| Formatting                               | Passed                                                                                |
| Package and documentation builds         | Passed                                                                                |
| Packed consumer                          | Passed: 704 files, 108 public examples and SSR with React 18.3.1 / 19.3.0             |
| Bundle/export audit                      | Passed: 126 runtime entries, 29 import comparisons, 11 stylesheets; budgets unchanged |
| Compiled browser regression suite        | 23 passed                                                                             |
| Compiled source identity                 | Select, SelectSheet and SelectionPanel source maps matched the final source           |

Browser: installed Chrome **157.0.8103.79** on Windows. The compiled run used
320px, 390px and 1440px widths, light/dark themes, LTR/Arabic RTL, scoped surface
tokens, default and disabled motion, and touch emulation. It covered header/body
dragging, animated handle dismissal, wheel/touch list scrolling, short/long/empty
results, visible focus outlines, Home/End/typeahead, form values, selection limits,
focus return, resize, nested dialogs, simulated keyboard-reduced height, optional
CSS imports and accessibility scans of open controls. Phone virtualization kept
fewer than 40 country rows mounted during the keyboard/wheel checks.

The actual documentation Select and MultiSelect previews were opened with
`presentation="sheet"`, checked after entry motion finished, visually inspected
and dragged closed. Physical-device, software-keyboard and screen-reader testing
was not performed. Remote CI results were not observed.

The released `apps/docs/public/plain-ui-0.3.0.tgz` was restored after candidate
package verification and confirmed unchanged (SHA-256
`564f02de2160232f57d8d9a45426c44489c4334e0e34375d4d621930cfdc0e84`).

## Reproduction and evidence

```sh
npm run test --workspace=@plain/ui -- tests/selection-surfaces.test.tsx tests/panel-gestures.test.tsx tests/phone-input.test.tsx tests/mobile-pickers.test.tsx --maxWorkers=1
npm run test:e2e -- tests/e2e/selection-sheet-gestures.spec.ts tests/e2e/selection-surfaces.spec.ts tests/e2e/production-optimization.spec.ts --workers=1
npm run check:bundles
```

The browser command uses the development server by default. Local production QA
built `.preview/selection-qa.config.mjs` to include the fixture pages alongside
the documentation, then set `PLAYWRIGHT_BASE_URL` to its isolated preview.

Git-ignored local evidence includes `.preview/selection-validation.json`,
`.preview/selection-{unit,typecheck,lint,docs-tests,build,package,bundles,format}.log`,
`.preview/selection-production-browser.log`, the compiled fixture build log and
the screenshots under `apps/docs/test-results`. The normal docs server on port
5173 was preserved.
