# Versioned Documentation

`docs/versions.json` is the single release registry. `/` follows the current
package version; `/v/0.2.0/` is its explicit URL. Archived versions have their
own HTML, hashed assets, library implementation, examples, search index, API
tables and guides. They do not render current components behind an old label.

## Build and Freeze

1. Set `current` to the version in `packages/ui/package.json` and mark exactly one entry
   `current`. A current entry tracks this checkout until it is archived.
2. To archive a release, mark its entry `archived` and set `ref` to the immutable
   Git commit containing that release. The script rejects moving branches,
   duplicate versions and package/revision mismatches.
3. Run `npm run docs:versions` or `npm run build:docs`. Archive sources are
   extracted under `.preview/docs-versions`, never checked out over user files.
   The archive installs its own lockfile dependencies and builds with that
   snapshot's Vite, React plugin and Tailwind tooling. If an old npm lockfile
   is incomplete, only that generated copy is repaired; provenance is recorded
   in `.snapshot.json`. The source revision remains pinned.

Archives are cached by source revision and adapter/build-script signature. Their
generated output lives in `apps/docs/public/v/<version>` and is copied into `apps/docs/dist`
during the current docs build. Generated artifacts are not Git source. Rebuilding
requires the pinned commits to remain available, so preserve release tags/history.

The builder detects both the historical single-package layout and this monorepo
layout. Monorepo snapshots use their own workspace lockfile, build their UI
package first, then build the archived docs app without recursively rebuilding
other archives. Documentation versions follow `@plain/ui`, not the private docs
app's placeholder version or a future icon package's release number.

The 0.1 adapter adds a router base, isolated preference keys and the version
switcher to the original app. It scopes static asset/download URLs and makes the
header accommodate that switcher on small screens. Its original component
implementations, guides, examples, catalog and visual defaults are preserved,
including historical defects. Adapter changes invalidate the archive build cache.

## Navigation and Hosting

The version switcher retains the current page, query and fragment when that page
exists in the target release. Missing components fall back to the target component
index; missing guides/platform collections fall back to its overview. Searches and
ordinary internal navigation are scoped by that release's router base.

Vite dev and preview use `scripts/docs-version-middleware.ts` for deep links. The
build emits `_redirects` for hosts that support that format. Other static hosts
must serve actual files first, then rewrite `/v/<archived-version>/*` to that
archive's `index.html`, `/v/<current-version>/*` to the current `index.html`, and
unversioned app routes to the current index. Do not use one global SPA fallback
before the archive rules. Unknown versions should return 404.

Every built version appears in `/docs-versions.json` with its exact available
routes and pinned revision. Commit this registry and release source, not generated
asset trees. Publication of a package or deployment remains a separate action.
