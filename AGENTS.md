# Working in P.UI

For UI design, implementation, composition, or review in this repository, read and
apply [.agents/skills/p-ui-design/SKILL.md](.agents/skills/p-ui-design/SKILL.md) by
default. This repo-local skill is available for implicit invocation; agents that
do not discover skills automatically should follow this link. No global install
is needed.

- Use **P.UI** for the product and **@plain/ui** for the package. Preserve
  `@plainui/react` when describing the 0.1 history or migration source.
- Keep the original 0.1 neutral colors by default; color generation is opt-in.
  Blocks and templates are application-owned copy/paste source in the docs, not
  component-library exports. Keep the header logo distinct from the PlainUI hero.
- Read current exports, types, and relevant component implementations before using
  an API. Skill references describe the foundation contract; current types
  determine what can compile as integration continues.
- Honor the current task's file ownership and existing work. When the user has
  authorized delegation, give parallel agents disjoint scopes and review their
  integration and QA. Delegation remains within that task's permissions.
- Record consumer-visible package changes with a Changeset. Follow
  [CONTRIBUTING.md](CONTRIBUTING.md) and the
  [release workflow](docs/releases/README.md); distinguish planned scope from
  verified results and publication.
