# Monorepo Migration Validation

Status: validated locally on 2026-10-02; not published or remotely deployed.
Candidate: the migration commit containing this record, based on `f5ce76f` on
`codex/next`. No package versions or documentation release references were advanced.

## Integrated Scope

- Private npm-workspaces root with one lockfile, npm 11.6.2 and Node 24.13.0.
- Public `packages/ui` and private `apps/docs`, with shared configuration in
  `tooling` and dependency-ordered Turborepo tasks.
- Original UI package name, version, export map, dist paths, React peers, runtime
  dependencies, CSS exports and neutral styles retained.
- Documentation uses public imports and compiled exports in production. Only
  exact public entries receive development/test source aliases; docs typechecking
  uses emitted package declarations.
- Existing table-query helpers are additionally exported through the public
  data-table entry so docs no longer import private implementation files. A minor
  Changeset records this compatible addition and the package relocation.
- Boundary validation, private-by-default package scaffolding, independent
  Changesets, Linux/Windows package CI and a separate documentation/browser job.
- Legacy archive support retained, with monorepo-snapshot path handling added.
  Blocks/templates remain empty and application-owned.

## Verified Results

Local host: Windows, Node 24.13.0, npm 11.6.2, headless Chrome 154.0.8037.95.

| Check                                       | Result                                                                                                                                                                                          |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Isolated clean install                      | `npm ci --ignore-scripts --offline`: 438 packages installed; UI and docs workspace links resolve within the isolated fixture                                                                    |
| `npm run check:workspaces` / `npm run lint` | Two workspaces pass dependency, import, export-boundary and cycle checks; ESLint passes                                                                                                         |
| `npm run typecheck`                         | Shared configuration, UI and docs pass                                                                                                                                                          |
| `npm run format:check`                      | Pass                                                                                                                                                                                            |
| `npm test`                                  | 9 infrastructure tests, 170 UI tests and 6 docs tests pass                                                                                                                                      |
| Scaffold proof                              | A generated React package builds real JSX exports into ESM and declarations; unsafe names, overwrites and boundary escapes are rejected                                                         |
| Independent release proof                   | Actual Changesets CLI versions an icon fixture separately from UI; a UI release updates the private docs dependency without bumping the app                                                     |
| `npm run build`                             | Library, production docs and the full 0.1 archive build successfully                                                                                                                            |
| Turbo reuse                                 | A subsequent dependency build replays the UI build from local cache                                                                                                                             |
| `npm run verify:package`                    | 181 package files, all public export targets, CSS/declarations, 101 complete examples, and packed React 18.3.1/19.3.0 consumers pass; zero compositions                                         |
| Button bundle                               | 20,558 gzip bytes, below the 25 kB budget; optional heavyweight engines remain outside the core consumer                                                                                        |
| Root package protection                     | Root `npm pack --dry-run` is rejected; packaging targets the explicit UI workspace                                                                                                              |
| Production release/archive tests            | 20 tests pass, including all 56 archived routes, independent assets/downloads, version switching, workbenches, motion policies, charts and empty collections                                    |
| Production home accessibility               | 4 tests pass at 1440, 768, 390 and 320 px                                                                                                                                                       |
| Production component accessibility          | 35 tests pass, including desktop and dark RTL mobile forms, Select, tables, Resizable, Sidebar, calendar, charts, Kanban and open-Select focus restoration                                      |
| Development workspace workflows             | 34 tests pass, including remote filtering, pagination, sticky/synchronized scrolling, keyboard/pointer boards, large Gantt/calendar datasets, printing, localization, Sheets and Stepper motion |

Browser evidence is local and ignored by Git:

- `.preview/monorepo-production-final`: release/versioned-preview screenshots.
- `.preview/monorepo-production-accessibility`: four home accessibility checks.
- `.preview/monorepo-production-components-final`: 35 compiled-component checks.
- `.preview/monorepo-development-final`: 34 workspace checks and screenshots.

Initial verification exposed a stale hardcoded browser port, an outdated CSS
reference, and a missing test type augmentation after relocation; all were
repaired and rechecked. A development accessibility scan timed out under load,
then passed both alone and in the full 34-test rerun. A compiled heatmap audit ran
during mounting; the browser helper now waits for fonts and two paint frames
before auditing, and all 35 production component checks pass. No heatmap styling
or behavior was changed to accommodate the audit.

## Remaining Limits

- These are selected local browser suites, not a rerun of every historical
  browser test. Automated accessibility does not prove physical-device or
  assistive-technology coverage.
- Remote Linux/Windows CI is configured but has not run for this commit. Branch
  protection, named CODEOWNERS, remote-cache policy, npm namespace ownership and
  registry credentials are not configured by this migration.
- The 0.1 legacy archive was rebuilt and browser-verified. A future release frozen
  from the new monorepo layout is supported by the adapter but has not yet been
  frozen and verified as an actual historical release.
- `@plain/icon` has not been implemented or published. The scaffold is tested and
  ready for a deliberately designed package; it starts private.
- No Git remote is configured, so this migration is committed locally, not pushed.

See the [monorepo guide](../monorepo.md) and [release workflow](README.md) for
ongoing development, package creation and release requirements.
