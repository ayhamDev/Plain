# P.UI Monorepo

## Architecture

The private `plain-workspace` root coordinates npm workspaces and Turborepo. It is
not an npm product. One root lockfile captures the entire dependency graph.

```text
PlainUI/
  apps/docs/              @plain/docs (private documentation app)
  packages/ui/            @plain/ui (public component library)
    src/ui/               existing public implementation
    tests/                unit tests
    scripts/              token and styling-slot generators
    dist/                 generated ESM, declarations and CSS
    CHANGELOG.md           independent package release history
  tooling/config/         shared Vitest and public-entry development aliases
  tooling/library/        library-build configuration for future packages
  tooling/testing/        common test environment
  scripts/                workspace guard, scaffold, archive and package checks
  docs/                   architecture and release/archive evidence
  .changeset/             independent release intents
  package-lock.json       the only workspace lockfile
  tsconfig.base.json      shared strict TypeScript contract
  turbo.json              dependency ordering and task caching
```

`@plain/ui` preserves its package name, public subpaths, ESM layout, CSS exports,
React peers and neutral defaults. The nested `src/ui` layout deliberately keeps
the existing `dist/ui` contract. Heavy optional engines remain separate entry
points. This restructure does not extract icons or change component appearance.

The docs depend on `@plain/ui` by its version and consume only public exports.
Production builds resolve the compiled package. Dev and unit tests resolve the
same public entries to source for HMR and fast feedback; unknown/private subpaths
are not aliased. Source aliases are development tooling, not consumer requirements.
Typechecking uses the library's emitted public declarations, not private source paths.
The only app-source exception is the shared `docs/versions.json` release registry.

## Task Graph

Run commands from the repository root with Node 24.13.0 and npm 11.6.2:

| Command                      | Result                                                        |
| ---------------------------- | ------------------------------------------------------------- |
| `npm ci`                     | Install all declared workspaces from the single lockfile      |
| `npm run dev`                | Build UI dependencies, prepare archives/downloads, start docs |
| `npm run dev -- --port 5176` | Start docs on another local port                              |
| `npm run build`              | Build workspaces in dependency order                          |
| `npm run build:lib`          | Build UI and its workspace dependencies                       |
| `npm run build:docs`         | Build UI dependencies, archives and production docs           |
| `npm run typecheck`          | Check shared tooling and every workspace                      |
| `npm run lint`               | ESLint and explicit dependency/boundary validation            |
| `npm test`                   | Infrastructure tests plus workspace unit tests                |
| `npm run test:e2e`           | Docs/browser regression tests                                 |
| `npm run verify:package`     | Packed UI consumers, examples, exports, SSR and bundle budget |
| `npm run pack:ui`            | Build and pack UI into `apps/docs/public`                     |
| `npm run release:status`     | Review independent Changesets release intent                  |

Use `npm.cmd` when PowerShell blocks npm scripts. Target a workspace task using
`npm run build -- --filter=@plain/ui` or `npm run test --workspace=@plain/ui`.
Direct docs dev commands require a prior UI build; the root dev command handles
dependency ordering. Set `PLAYWRIGHT_BASE_URL` to use an already running server;
otherwise Playwright starts the root docs development workflow automatically.
`PLAYWRIGHT_SERVER=preview` starts the compiled docs preview instead; run
`npm run build:docs` first and select tests without development-only fixture URLs.

Turborepo caches library `dist/**`, tests and typechecking using package inputs,
the lockfile and shared tooling/configuration. Dependencies build before their
consumers. Docs builds are deliberately uncached because preparing complete Git
archives has side effects outside the app's `dist` directory. Dev servers are
persistent and uncached. Remote caching is not configured and needs explicit
credentials and access policy before enabling it.

## Add A Package

For a future React icon library:

```sh
npm run create:package -- icon --react --dry-run
npm run create:package -- icon --react
npm install
```

This creates `packages/icon` named `@plain/icon`, initially private. No root
workspace-list edit is necessary. The scaffold includes ESM/declaration builds,
strict TypeScript, a test runner, an export map, MIT license, README and changelog.
`--react` adds the React peer and build plugin; omit it for framework-neutral code.
Existing directories, unsafe names and paths outside the repository are rejected.

Implement real exports in `src/index.ts`, add tests and declare dependencies in
that package's manifest. The empty scaffold permits no tests initially; remove
`--passWithNoTests` before publishing so missing tests fail. Add CSS to `sideEffects`
if the package imports styles; the default `false` assumes pure JavaScript.

When ready for a reviewed release, set `private: false`, add
`publishConfig: { "access": "public" }`, choose the initial version, and add a
Changeset naming `@plain/icon`. `--publishable` is available for intentionally
creating a public candidate, but neither option publishes anything. Namespace
ownership and the final icon API remain separate decisions.

For UI to consume it, declare a compatible version in `packages/ui/package.json`
and import from `@plain/icon`, never `../../icon/src`. npm links matching local
versions; published manifests retain real semver ranges for external consumers.
Keep public packages independent unless a genuine runtime dependency is needed.

## Guardrails And Releases

`npm run check:workspaces` parses TypeScript/JavaScript imports and CSS imports.
It rejects undeclared runtime dependencies, private workspace entry points,
cross-workspace relative source imports, cyclic dependencies, public runtime
dependencies on private workspaces, app dependencies in libraries, and incomplete
public package metadata. Config and test files may use shared root tooling.
Every workspace must provide build, typecheck and test tasks. These checks are
regression guardrails, not a substitute for reviewing dynamic runtime loading.

Changesets has no fixed/linked groups. Public packages release independently;
private apps and unfinished packages are not versioned or tagged. Changelogs live
with packages. The root changelog is an index preserving access to UI history.
Changesets still updates private consumers' internal dependency ranges when a
public dependency releases, without bumping their placeholder versions.
Follow [the release workflow](releases/README.md), validate each actual packed
consumer, and review the version/lockfile changes before publishing. Root `npm
pack` is intentionally rejected; target an explicit workspace instead.

CI validates packages on Linux and Windows, and builds documentation/browser
checks separately. It uses read-only repository permissions, immutable action
revisions, full history for archived docs, bounded jobs and failure artifacts.
It does not publish packages or deploy documentation. Remote CI, branch
protection, named CODEOWNERS and registry permissions require the hosting/team
configuration; they are not established merely by these local files.

Historical documentation remains isolated. The archive builder understands both
legacy and monorepo snapshots and installs their own lockfile dependencies. See
[the archive workflow](versions/README.md). `@plain/icon` releases do not change
UI documentation version numbers automatically.

Local verification and remaining limits are recorded in the
[migration validation record](releases/monorepo.md).

Implementation references: [npm workspaces](https://docs.npmjs.com/cli/v11/using-npm/workspaces),
[Turborepo task configuration](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks),
and [Changesets configuration](https://github.com/changesets/changesets/blob/main/docs/config-file-options.md).
