# a11y-skills — contributor guide for agents

Multi-agent accessibility auditing plugin + skillset. Read `docs/DESIGN.md` for architecture and `docs/IMPLEMENTATION.md` for the phased build plan (work top-to-bottom; check off steps as they complete).

## Commands

- `npm run build` — build all workspaces (`packages/*`, `reporters/*`)
- `npm test` — Vitest across all workspaces
- `npm run lint` — ESLint (flat config, root-wide)
- `npm run validate:skills` — Agent Skills spec check for `.github/plugins/a11y/skills/*`
- `npm run validate:manifests` — consistency check across the four marketplace manifests

## Layout

- `.github/plugins/a11y/` — **canonical plugin source** (skills + hooks). The manifests in `.claude-plugin/`, `.cursor-plugin/`, `.agents/plugins/`, and `.github/plugin/` all point here and must stay in sync (CI enforces this).
- `packages/` — the audit engine; `packages/core` is the `@aidevme/a11y` CLI.
- `reporters/` — pure `Finding[] → format` transforms; no independent logic.
- `examples/` — seeded-violation fixtures; every rule must have a fixture asserting its exact findings.

## Conventions

- **Never hand-edit `docs/rule-reference.md`** — it is generated from rule metadata.
- Every rule carries `wcagRef`, `wcagLevel`, `wcagVersion` metadata; no rule may map to SC 4.1.1 (report under 4.1.2 instead).
- Rules for SC 1.4.2, 2.1.2, 2.2.2, 2.3.1 (non-interference) are never relaxed by profiles and never baseline-eligible.
- Skill folders follow the Agent Skills spec: `SKILL.md` (frontmatter `name` must match the directory) plus optional `scripts/`, `references/`, `assets/`, `evals/`.
- A rule without a fixture test asserting exact expected findings is not done.
