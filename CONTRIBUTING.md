# Contributing to P.UI

The product is **P.UI**; the package is **@plain/ui**. The 0.1 local
baseline used `@plainui/react`. Read [AGENTS.md](AGENTS.md) and use the
[repo-local design skill](.agents/skills/p-ui-design/SKILL.md) for UI changes.
Check current types/exports when composing or extending components.

Use the Node version supported by `package.json`, npm, and the existing lockfile.
See [README.md](README.md) for setup and package consumption. On Windows,
`npm.cmd` works when execution policy blocks `npm.ps1`.

Keep documented engine compatibility pins when changing dependencies. Choose
versions supported by the package and lockfile, and verify Node/SSR imports as
well as browser builds after an engine upgrade. See the
[0.2 compatibility notes](docs/releases/0.2.0.md) for the Material color engine
constraint and current Tailwind tooling.

## Changes and Evidence

Keep edits within the assigned ownership. Preserve native control contracts,
typed styling slots, semantic tokens, RTL behavior, and focus when changing UI.
Update affected examples and public documentation with consumer-visible changes.
For integrated code changes, run the relevant tests and the repository's required
typecheck, lint, formatting, build, package, and browser checks. For documentation
alone, check formatting, links, and factual API claims. Record what ran and what
remains unverified; scope browser QA to affected workflows.

## Changesets

Add `.changeset/<unique-name>.md` for a releasable consumer change. Name the single
package `@plain/ui` in frontmatter and explain the resulting behavior and migration.
Use `patch` for compatible fixes and `minor` for compatible additions. During 0.x,
breaking changes may use an agreed minor release, with explicit migration notes;
`major` advances the package to 1.0 and needs a deliberate version decision.
Repo-only documentation does not automatically require a package bump.

The local Changesets CLI and scripts are installed: `npm run changeset` creates an
entry and `npm run release:status` previews the plan. The 0.2 version is already
assigned during integration, so its local record lives in the changelog/release
note and an empty Changeset acknowledges integration without a pending bump.
Add entries for subsequent release changes.
See [.changeset/README.md](.changeset/README.md) for the format and versioning rules.

Maintainers follow [docs/releases/README.md](docs/releases/README.md) to version,
review migrations, validate the exact candidate, and record a local release.
Publishing or deploying follows the user's existing authorization and is recorded
only after it succeeds. Keep historical release evidence separate from current QA.

Documentation releases are registered in [docs/versions.json](docs/versions.json).
Follow [the archive workflow](docs/versions/README.md) to pin and build a complete
version, including its own implementations, guides, previews and downloads.
