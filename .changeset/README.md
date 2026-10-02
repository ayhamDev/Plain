# P.UI Changesets

Packages are independently versioned. Changeset frontmatter names each affected
publishable package, not the private repository root or documentation app:

```md
---
'@plain/ui': patch
---

Describe the observable consumer change and any migration.
```

Use a unique Markdown filename per independently releasable change. Add a
Changeset for consumer-visible behavior, API, styles, or dependency changes;
repo-only documentation changes do not necessarily require a package release.
Use `patch` for compatible fixes and `minor` for additions. During 0.x, explicitly
document agreed breaking changes in a minor release; `major` advances to 1.0.

Version 0.2.0 is already assigned in `packages/ui/package.json`. Its scope lives in
`packages/ui/CHANGELOG.md` and `docs/releases/0.2.0.md`. `p-ui-0-2.md` is a standard empty
Changeset acknowledging that integration; it schedules no additional bump. A minor
Changeset against the current manifest would plan 0.3.0. Create entries for
subsequent changes and deduplicate overlapping worker contributions.

Changesets 3.0.3 is installed locally. Use `npm run changeset`,
`npm run release:status`, and `npm run version:packages`. Do not reinitialize this
directory. `config.json` uses public access, no fixed or linked groups, and no
automatic commits. Private workspaces are not versioned or tagged.
`baseBranch: codex/next` matches the existing integration branch;
update it when the integration target changes.

See the [release workflow](../docs/releases/README.md) and
[Changesets guide](https://changesets.dev/guide/getting-started).
