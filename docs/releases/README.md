# P.UI Release Workflow

This repository releases one package, `@plain/ui`. The docs site, blocks, and
templates belong to that product; they are not additional workspace packages.
The package rename and local Changesets CLI/scripts are integrated. Use
`npm.cmd` on Windows when PowerShell blocks `npm.ps1`.

Keep three records with distinct purposes: Changesets describe releasable
consumer changes, root [CHANGELOG.md](../../CHANGELOG.md) records version history,
and `docs/releases/<version>.md` records migrations and validation evidence.
Start each release note from [TEMPLATE.md](TEMPLATE.md). Keep the prior release
history, including the 0.1 local-release status and its original QA limitations.

## Prepare the Release

1. Reconcile the intended scope with integrated exports, types, docs, and examples.
   Remove unimplemented claims and deduplicate overlapping Changesets.
   During 0.x, breaking migrations use the agreed next minor version and must be
   explicitly described; choosing `major` advances to 1.0.
2. Confirm every Changeset names the root package and `baseBranch` names the
   branch used for integration (currently `codex/next`). No monorepo groups are
   required. Read the plan:

   ```sh
   npm run release:status
   ```

3. Compare the planned version with the manifest and release note. **0.2.0 is
   already assigned during integration**; its empty Changeset acknowledges the
   integration without a pending bump. Finalize its local record after QA. For a
   subsequent release, run local versioning only when the plan assigns the intended
   next version:

   ```sh
   npm run version:packages
   npm install --package-lock-only
   ```

   Review the resulting version, lockfile, consumed Changesets, and generated
   changelog. Replace a matching root `Unreleased` draft with the release entry
   and reconcile its prose. When finalizing the already assigned 0.2 version,
   promote its existing draft without another version bump. Preserve 0.1 history.

4. Run the repository checks against the exact candidate:

   ```sh
   npm run typecheck
   npm run lint
   npm run format:check
   npm test
   npm run build
   npm run verify:package
   npm run test:e2e
   npm pack --dry-run
   ```

   The build/package commands may regenerate artifacts. Review only intentional
   tracked changes. Verify an installed package consumer, CSS/subpath exports,
   declarations, SSR, and compilable public examples, especially newly added APIs.

5. Perform the [design skill's browser QA](../../.agents/skills/p-ui-design/references/qa.md)
   on the changed workflows. Record command outcomes, browsers/versions, viewports,
   candidate commit, evidence paths, and omissions in the version's release note.
   Physical devices, assistive technology, and remote CI are separate evidence.

## Record and Distribute

Change a draft to **validated local release** only after checking that candidate;
use the actual date and evidence. Leave unresolved checks visible. An npm archive
or a configured CI job does not prove registry publication or a remote CI pass.

For requested publication, first review the exact package contents and migration
notes, confirm the intended npm registry and scoped package ownership, then use
the installed CLI's publish command. Public access in config expresses the package
visibility; it is not permission to publish. Follow the user's existing publication
authorization and task scope. Record the actual registry/version link and tag only
after success; handle website deployment as its own requested operation.

The workflow follows the [Changesets guide](https://changesets.dev/guide/getting-started)
and [configuration reference](https://github.com/changesets/changesets/blob/main/docs/config-file-options.md).
