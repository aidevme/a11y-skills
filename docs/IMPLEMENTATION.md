# a11y-skills — Implementation Plan

**Status:** Draft
**Source design:** [DESIGN.md](DESIGN.md) — section references (§) below point there.
**Test plan:** [TEST_PLAN.md](TEST_PLAN.md) — formal acceptance criteria (AC-Px-n) and enumerated test cases (TC-Px.y-nn) for every phase below, including assertion snippets. A phase is not releasable until its ACs hold and its test cases pass; the inline "Done when" lines here are the summary form of those ACs.
**How to use this file:** work top-to-bottom; each step lists substeps as checkboxes, its deliverables (exact files/packages), and acceptance criteria ("Done when"). Steps within a phase are ordered by dependency — do not reorder across the dependency notes.

---

## Phase overview & dependency graph

| Phase | Delivers | Depends on |
|---|---|---|
| **P0 — Scaffolding** | Workspace, manifests, CI shell, doc/config conventions | nothing |
| **P1 — MVP** | Core engine + CLI, React Layer 1, Markdown reporter, router/audit/init skills, minimal Layer 0 | P0 |
| **P2 — v1** | SARIF + HTML reporters, Layer 2 runtime, compliance profiles, CI action + AzDO, fixtures/evals, marketplace submissions | P1 |
| **P3 — v1.5** | Static-HTML + Vue rule packs, metadata-driven A11Y.md, pre-commit hook | P2 |
| **P4 — v1.6** | Angular + Svelte rule packs, Claude Code hooks | P3 |
| **P5 — v2** | Surface Detector, PCF adapter + domain rules, PCF/Dataverse guides | P2 (P3/P4 not required) |
| **P6 — v3** | Code Apps adapter, Cursor marketplace, optional VS Code extension | P5 |
| **P7 — v4** | Power Pages adapter (Liquid parser + live-crawl), portal guides | P5, P3 (needs `rules-static-html`) |

Cross-cutting rule for every phase: **all layers emit the shared `Finding` schema (§2), and every new rule carries `wcagRef`/`wcagLevel`/`wcagVersion` metadata (§5)** — no exceptions, since profiles (§2.3b), reporters (§6), and the generated docs (§8) all read that metadata.

---

## Phase 0 — Repo scaffolding

Goal: the Dataverse-skills layout from day one (§3, §10 — "near-zero cost at the start, expensive to retrofit"). Nothing here requires engine code.

### 0.1 Workspace & tooling baseline

- [x] Initialize npm workspaces in root `package.json`: workspaces = `packages/*`, `reporters/*`.
- [x] TypeScript baseline: root `tsconfig.base.json` (strict mode, ES2022, NodeNext resolution); each package extends it.
- [x] Test runner: Vitest at root (fast, TS-native, workspace-aware). Single root `vitest.config.ts` globbing all workspace test files.
- [x] Linting/formatting: ESLint flat config + Prettier at root. Dogfooding note: once P1 ships, add our own audit to this config's CI job (§9).
- [x] Changesets (or equivalent) for independent per-package versioning — required because each rule pack publishes as its own npm package (§8).
- [x] `LICENSE` (MIT), confirm existing `SECURITY.md`, `CONTRIBUTING.md`, `CODEOWNERS`, `CODE_OF_CONDUCT.md`; add `SUPPORT.md`. *(Note: SECURITY.md, CONTRIBUTING.md, CODEOWNERS, CODE_OF_CONDUCT.md exist but are empty — content still needed.)*

**Done when:** `npm install && npm run build && npm test` succeed on an empty-but-typed workspace; CI runs the same three commands on PR.

### 0.2 Plugin source & host manifests

- [x] Create canonical plugin tree `.github/plugins/a11y/` with `skills/` and `hooks/` directories (empty `hooks/` for now — filled in P4).
- [x] Create per-skill directory skeletons exactly as §3 specifies: `a11y-overview/` (SKILL.md only), `a11y-audit|init|fix/` (SKILL.md + `scripts/` + `references/` + `assets/` + `evals/`), topic guides `a11y-forms|dialogs|keyboard|pcf|pages/` (SKILL.md + `references/` + `assets/` + `evals/`, **no** `scripts/`).
- [x] Verify/align the four existing marketplace manifests (`.claude-plugin/`, `.cursor-plugin/`, `.agents/plugins/`, `.github/plugin/marketplace.json`) all point to `./.github/plugins/a11y` with matching name, description, version. *(Enforced continuously by `scripts/check-manifests.mjs` in CI.)*
- [x] Add `.azdo/` directory with a placeholder pipeline YAML (filled in P2).
- [x] Validate every skill directory against the Agent Skills spec in CI — even skeleton SKILL.md files must have valid frontmatter (`name` matching directory, non-empty `description`). *(Implemented as `scripts/validate-skills.mjs` — a dependency-free spec check run by CI; the official `skills-ref` tool remains runnable locally via `validate-skills-official.sh`.)*

**Done when:** `skills-ref validate` passes for all nine skills; all four manifests agree; a fresh clone installs cleanly as a local plugin in Claude Code.

### 0.3 Docs & config conventions

- [x] `docs/safety-and-guardrails.md`: document what hooks may block and what the CLI reads/transmits (nothing leaves the machine) — §3 docs convention.
- [x] `docs/rule-reference.md`: placeholder with a header stating it is generated (generator lands in P1.6).
- [x] Root `CLAUDE.md`: repo conventions for agent contributors (build commands, where rules live, "never hand-edit rule-reference.md").
- [x] Define `.a11yrc.json` JSON Schema file (`packages/core/schemas/a11yrc.schema.json`) now, even before the engine reads it: `rulePacks: string[]`, `profile: "strict"|"standard"|"mvp"`, `wcagVersion: "2.0"|"2.1"|"2.2"`, `overrides: Record<ruleId, severity>`, `runtime?: {...}` (§8). Schema-first prevents config drift later. *(Schema-validation test lives in `packages/core/tests/`.)*

**Done when:** docs exist; `.a11yrc.json` schema validates the example config committed under `examples/`.

---

## Phase 1 — MVP

Goal (§10): React + generic Web App path end-to-end — Layer 1 static audit through the CLI, Markdown report, three working skills, minimal Layer 0. Ship order inside the phase matters: core schema → detector → rule packs → reporter → CLI → skills → Layer 0.

### 1.1 `packages/core` — finding schema, aggregator, CLI skeleton

The single most load-bearing package: every later phase codes against these types.

- [x] **1.1.1 Finding schema** (`src/finding.ts`). Fields, all consumed by §5/§6:
  - `ruleId: string`
  - `severity: "error" | "warning" | "info"` (post-profile-mapping effective severity)
  - `baseSeverity` (the rule's own severity before profile adjustment — reporters show both in brownfield mode)
  - `wcagRef: string` (e.g. `"4.1.2"`), `wcagLevel: "A"|"AA"|"AAA"`, `wcagVersion: "2.0"|"2.1"|"2.2"`
  - `nonInterference: boolean` — derived: true iff `wcagRef` ∈ {1.4.2, 2.1.2, 2.2.2, 2.3.1} (§2.3b floor; never relaxed, never baselined)
  - `message: string`, `file: string`, `range?: {startLine, startCol, endLine, endCol}`
  - `layer: 0|1|2|3`, `surface: "web-app"|"pcf"|"code-apps"|"power-pages"`, `framework?: string`
  - `page?: string` (Layer 2 per-page conformance grouping, §6), `fingerprint: string` (rule + file + normalized-context hash; line-number-drift-resilient — needed by baseline, §12)
  - `fix?: { description: string; diff?: string }` (consumed by `a11y-fix`)
- [x] **1.1.2 Adapter interfaces** (`src/adapters.ts`): `FrameworkAdapter` exactly as §2.2 (`id`, `detect(projectRoot)`, `lint(files): Finding[]`, `devServerCommand?`), plus `SurfaceAdapter` (`id`, `detect(projectRoot)`, `layer1Packs: string[]`, `layer2Target(config)`, `layer3RuleFiles: string[]`) — defined now, first non-web-app implementation in P5.
- [x] **1.1.3 Registry** (`src/registry.ts`): register adapters + rule packs; `detectAll(projectRoot)` returns matching adapters (first-match for surface, all-match for frameworks). Adding an adapter must require zero core changes (§2.2 — "a new package implementing this interface plus a registration line").
- [x] **1.1.4 Aggregator** (`src/aggregate.ts`): merge findings from all layers, dedupe by fingerprint, apply profile severity mapping (identity mapping until P2.4 ships profiles), apply baseline filtering (no-op until P2 baseline; but design the pipeline stage now), sort by severity → wcagRef → file.
- [x] **1.1.5 Config loader** (`src/config.ts`): read `.a11yrc.json`, validate against the P0.3 schema, apply defaults (`profile: "standard"`, `wcagVersion: "2.2"`).
- [x] **1.1.6 CLI** (`src/cli.ts`, bin `a11y`, published as `@aidevme/a11y`): subcommands `audit` (this phase), `init` (1.8), `baseline` (P2), `fix` (P2). `audit` flags: `--scope`, `--format md|json` (sarif/html in P2), `--fail-on error|warning|never`, `--output <file>`. **Exit codes are API** (CI depends on them, §7): `0` clean/below threshold, `1` findings at/above `--fail-on`, `2` execution error. Document in `--help` and README.
- [x] **1.1.7 Unit tests**: schema validation, fingerprint stability (same violation, shifted lines → same fingerprint), aggregator dedupe/sort, exit codes.

**Done when:** `npx a11y audit --format json` on an empty project returns `[]` with exit 0; all unit tests green.

### 1.2 `packages/framework-detector`

- [x] Implement `detect()` for React only in this phase (`.jsx`/`.tsx` present or `react` in `package.json` deps — §2.2 table), but structure as a table of marker-checks so P3/P4 additions are data, not code.
- [x] Fluent UI sub-detection: `@fluentui/react-components` in deps → sets `fluent: true` flag consumed by 1.4.
- [x] Tests: fixture `package.json`s + file trees for react/react+fluent/none.

**Done when:** detector correctly classifies the three fixture projects.

### 1.3 `packages/rules-react` — Layer 1 base pack

- [x] Wrap `eslint-plugin-jsx-a11y` via ESLint's Node API (not shell-out): run programmatically over the file set, translate ESLint messages → `Finding` (map each jsx-a11y rule → our `ruleId` + WCAG metadata via a static mapping table `rules-map.json`).
- [x] The mapping table is the pack's real content: for every enabled jsx-a11y rule, record `ruleId` (ours, prefixed `react-`), `wcagRef`, `wcagLevel`, `wcagVersion`, default `severity`, remediation one-liner (feeds `fix.description` and P3 A11Y.md generation).
- [x] **SC 4.1.1 handling (§5):** any upstream finding mapped to 4.1.1 is remapped to 4.1.2 or dropped, per the errata — encode this in the mapping table, add a test proving no emitted finding ever carries `wcagRef: "4.1.1"`.
- [x] Target ~15 rules (§5 sizing) — enable the jsx-a11y recommended set, prune to the mapped list.
- [x] Fixture tests: seeded-violation components (missing alt, unlabeled input, positive tabindex, click-without-key…) each asserting the **exact** expected findings list (§9 — "not just 'does it run'").

**Done when:** all fixtures produce exact expected findings; zero findings on a clean fixture.

### 1.4 `packages/rules-fluent-ui` — Fluent v9 semantics pack

The differentiator pack (§1). Custom ESLint rules, since no upstream plugin knows Fluent v9's ARIA behavior.

- [x] Research pass: enumerate Fluent v9 components with a11y-relevant props/behavior (`Dialog`+`aria-modal`, `Field`/`Label` pairing, `Menu` trigger semantics, icon-only `Button` without `aria-label`, `DataGrid` header/sort semantics, `Combobox` labeling, `Image` alt, `Spinner`/`ProgressBar` labeling…). Output: `references/fluent-v9-a11y-notes.md` in the repo — this doubles as the `a11y-audit` skill's reference material.
- [x] Implement as custom ESLint rules (AST: JSXOpeningElement matching imported Fluent identifiers — must resolve import source to avoid false-positives on same-named local components).
- [x] Same mapping-table + fixture-test regime as 1.3. Initial target: 6–10 rules, growing later; every rule carries WCAG metadata.
- [x] Only activated when framework-detector reports `fluent: true`.

**Done when:** Fluent fixtures (e.g. `Dialog` with clobbered `aria-modal` per §9) yield exact findings; pack is skipped entirely on non-Fluent projects.

### 1.5 `reporters/markdown`

- [x] Pure transform `Finding[] + RunMeta → string` — **no independent logic** (§6): grouping severity → WCAG SC → file; per-finding: message, file:line, WCAG ref link (to w3.org Understanding page), remediation line.
- [x] Summary header: totals by severity, profile + wcagVersion in effect, pass/fail verdict vs `--fail-on`.
- [x] Golden-file snapshot tests (§9).

**Done when:** snapshot tests green; `a11y audit --format md` renders the fixture project readably in a terminal and in a GitHub comment.

### 1.6 Rule-metadata doc generator

- [x] Script (`packages/core/scripts/gen-rule-reference.ts`) that walks all registered packs' mapping tables and regenerates `docs/rule-reference.md` (§8 — "generated from rule metadata, not hand-written").
- [x] CI check: regenerate and diff; fail if stale.

**Done when:** `docs/rule-reference.md` lists every 1.3/1.4 rule with WCAG columns; CI catches a deliberately-stale copy.

### 1.7 Skills: `a11y-overview` (router) + `a11y-audit`

- [x] **`a11y-overview/SKILL.md`** (§4.4): cross-cutting rules — always cite WCAG SC refs, severity language conventions, profile awareness; routing table: "audit/check accessibility" → `a11y-audit`, "set up/initialize" → `a11y-init`, "fix findings" → `a11y-fix` (stub until P2), topic questions → the matching guide skill. Keep under 100 lines — it's a router, not content.
- [x] **`a11y-audit/SKILL.md`**: frontmatter per §4.4 example (`allowed-tools: Read, Bash, Glob, Grep`). Body flow: run CLI detect → run `a11y audit --format json` → summarize by severity → **propose concrete diffs for top N issues, not a report dump** (§4.4).
- [x] `a11y-audit/scripts/`: thin wrapper script(s) invoking the CLI with JSON output (so the skill parses structured data, not prose).
- [x] `a11y-audit/references/`: rule-pack summary + output-format notes (what each JSON field means).
- [x] Skill-level evals (`a11y-audit/evals/`): scenario — given the seeded-violation fixture, does the skill run the CLI and surface the top findings with diffs?

**Done when:** in a live Claude Code session against the fixture project, `/a11y-audit` produces findings + at least one proposed diff; router directs "check accessibility of this file" to the audit skill.

### 1.8 Layer 0 minimal + `a11y-init` skill

Static-template form only (metadata-driven generation is P3 — §10 note).

- [x] **`packages/context-gen`** v0: `a11y init` CLI subcommand that (a) copies/fills the static `A11Y.md` template (parameterized by detected framework only, since surface detection is P5), (b) detects present hosts (`.cursorrules`? `.github/copilot-instructions.md`? `CLAUDE.md`/`.claude/`? `AGENTS.md`? — §4.2) and appends/creates the one-line pointer snippet in each, idempotently (re-running must not duplicate the pointer).
- [x] `A11Y.md` template content: compliance-profile statement, core semantic rules (headings, labels, keyboard, focus), framework-specific section (React/Fluent for MVP), pointer to the topic guides.
- [x] Writes a default `.a11yrc.json` if absent.
- [x] **`a11y-init/SKILL.md`** + `scripts/` (host-detection wrapper) + `assets/` (the A11Y.md template lives here as the skill's asset, single-sourced with the npm package via the build) + `references/` (profile definitions) + `evals/` (correct host files generated per detected agent combination).
- [x] **First topic-guide skills** (4–5 per §10): write `a11y-forms`, `a11y-dialogs`, `a11y-keyboard` SKILL.md + `references/` guides now (framework-neutral APG-derived content + Fluent v9 specifics); `a11y-pcf`, `a11y-pages` remain minimal stubs until P5/P7 with an honest "coming in vN" description so the router doesn't dead-end.

**Done when:** `npx @aidevme/a11y init` on a fixture repo with `.cursorrules` + `CLAUDE.md` produces `A11Y.md`, `.a11yrc.json`, and both pointers; running twice changes nothing; init evals pass.

### 1.9 MVP wrap-up

- [x] Dogfooding CI job (§9): run `a11y audit` on this repo's own TS/HTML sources.
- [x] README: install per host (§4.1 matrix), quickstart, exit codes.
- [ ] Publish `@aidevme/a11y` + rule packs to npm (scoped, public). *(Pending — needs npm credentials; when ready: `npx changeset` to record versions, then `npx changeset publish`.)*

**Done when:** a colleague can install the plugin in Claude Code, run `/a11y-audit` on a React app, and get findings + diffs, with no repo-local setup.

---

## Phase 2 — v1

Goal (§10): CI-grade outputs (SARIF), the client deliverable (HTML), runtime Layer 2, compliance profiles, baseline workflow, pipelines, marketplace submissions.

### 2.1 `reporters/sarif`

- [x] Transform findings → SARIF 2.1.0 via `@microsoft/sarif` SDK (§11): one `run`, `rules` array populated from rule metadata (WCAG ref in `helpUri`), `results` with `fingerprints` (ours) so GitHub code scanning tracks new/fixed/persistent across PRs (§12.4).
- [x] Golden-file snapshot tests + upload validation against GitHub's SARIF ingestion rules (size caps, required properties).

**Done when:** uploading the fixture project's SARIF to a test repo shows PR annotations on the seeded violations.

### 2.2 `reporters/html`

The client deliverable (§6) — treat as a product surface, not a dev tool.

- [x] Single self-contained file (inline CSS/JS, zero external requests — attachable/emailable).
- [x] Contents per §6: summary dashboard (by severity / WCAG SC / surface; pass-fail per profile), filterable+sortable findings table, per-finding detail (code excerpt, remediation, WCAG link), baselined-vs-new marking (§12.1).
- [x] `--compare previous.html`: parse the embedded JSON data block of a prior report, render trend (new/fixed/persistent counts + per-rule delta).
- [x] **Per-page grouping + process grouping** (§6, WCAG 5.2.2/5.2.3): findings grouped per page; optional `processes` config in `.a11yrc.json` mapping page lists to named flows; a flow is marked failed if any member page fails.
- [x] Optional **conformance-claim block** (§6, WCAG 5.3.2): date, version+level targeted, pages in scope, technologies relied upon — emitted in JSON and rendered in HTML when `--claim` passed.
- [x] **The report itself must pass WCAG AA** (§6): the reporter's test suite serves its own output and runs the P2.3 axe harness against it; failure of this test fails the build.

**Done when:** report renders from fixture data; compare mode shows a synthetic trend; the axe-on-own-output test is green and wired into CI.

### 2.3 `packages/runtime-axe` — Layer 2

- [x] Playwright + axe-core harness: input = URL list (or single URL + same-origin crawl with depth/page caps), output = `Finding[]` with `layer: 2`, `page` set, axe rule IDs mapped → our ruleId + WCAG metadata (axe supplies WCAG tags — translate, and apply the 4.1.1 remap from §5).
- [x] **Viewport matrix** (§2 Layer 2 item a): each page scanned at 320 px width (SC 1.4.10 — additionally assert no horizontal scroll at 320), tablet (768), desktop (1280). Findings tagged with viewport; dedupe identical findings across viewports into one finding with a `viewports` list.
- [x] **Text-spacing override test** (item b, SC 1.4.12): inject the specified line-height/letter/word-spacing CSS, detect content loss (element clipping/overflow heuristics).
- [x] **Orientation check** (item c, SC 1.3.4): portrait + landscape emulation, flag content/functionality present in one but not the other.
- [x] CLI wiring: `a11y audit --runtime --url <u>` (generic point-at-a-URL mode — per Open Question 2 start with this; surface-specific launchers can layer on in P5–P7); optional `devServerCommand` boot from the framework adapter when no URL given.
- [x] Tests against static fixture pages served locally (seeded axe violations, a reflow-breaking page, a spacing-fragile page).

**Done when:** harness run against fixture pages reproduces the seeded expected-findings lists across the viewport matrix.

### 2.4 Compliance profiles (§2.3b)

- [x] Severity-mapping module in `core`: profile × rule metadata → effective severity. `strict`: all error. `standard` (default): A/AA error, AAA warn. `mvp`: visual/contrast rules → warning, **semantic-structure rules never relax** — requires a `category: "visual"|"semantic"|...` field added to rule metadata in every pack's mapping table (do this refactor first).
- [x] `wcagVersion` filter: exclude rules whose `wcagVersion` postdates the configured version (2.1 config drops 2.2-only rules).
- [x] **Non-interference floor:** rules with `nonInterference: true` are exempt from all relaxation and from baseline eligibility — enforce in the aggregator, test explicitly for all four SCs.
- [x] Profile also parameterizes the `A11Y.md` template (init writes profile-appropriate guidance).

**Done when:** the same fixture audit run under each of the three profiles × two wcagVersions yields the documented severity/inclusion differences; non-interference findings are errors under every combination.

### 2.5 Baseline workflow (§12) + `a11y-fix`

- [x] `a11y baseline` subcommand: snapshot current findings to `.a11y-baseline.json` (fingerprints only). `a11y baseline --prune`: drop entries no longer found (baseline only shrinks). Aggregator: baselined findings → reported-but-non-failing; **non-interference findings are never baseline-eligible** (fail immediately, §12.1).
- [x] HTML/MD/SARIF reporters mark baselined findings distinctly.
- [x] **`a11y-fix` skill** (SKILL.md + scripts + references + assets + evals): input = audit JSON; per finding, look up the fix pattern in `references/` (one file per ruleId family), propose minimal diff, apply on approval. Evals: valid, minimal diff for each seeded fixture violation.

**Done when:** brownfield fixture (20 seeded findings) can baseline, then a newly-introduced violation fails the gate while the 20 don't; `/a11y-fix` produces an applying diff for a missing-label finding.

### 2.6 CI/CD packaging (§7)

- [x] **GitHub Action** `aidevme/a11y-action@v1` (composite action wrapping the CLI): inputs `scope`, `fail-on`, `report-format`, `runtime` (opt-in, needs build/preview step), `baseline`. SARIF auto-upload to code scanning when `report-format: sarif`.
- [x] **`.azdo/` pipeline template**: equivalent parameters; publish HTML report as pipeline artifact.
- [x] Both dogfooded on this repo's CI.

**Done when:** a demo repo consuming the action shows PR annotations; the AzDO template runs green in a test project.

### 2.7 Test hardening & evals

- [x] Complete the fixture matrix under `examples/`: per-rule seeded violations for every shipped pack (§9).
- [x] Root-level agent evals (`evals/tests/`, distinct from per-skill evals — §3): router picks the right specialist for ~10 phrasings; `a11y-audit` drives the CLI correctly end-to-end.

**Done when:** eval suite runs in CI (scheduled, not per-PR if cost-bound) and passes.

### 2.8 Marketplace submissions (§10)

- [ ] Claude Code: submit to claude-plugins-official; our repo stays installable as a marketplace source either way. *(Pending — external submission, needs a maintainer to open the PR against that marketplace repo.)*
- [ ] Copilot: submit to awesome-copilot. *(Pending — same.)*
- [ ] Codex: repo-as-marketplace — verify the `.agents/plugins/marketplace.json` install path against current Codex docs at submission time (host formats move fast; re-validate rather than trusting this document). *(Manifest is in place and validated by `npm run validate:manifests`; the "verify against current Codex docs" step is a point-in-time check to redo at submission time.)*
- [x] Cursor: document the manual copy path (§4.1) in README until a marketplace exists.

**Done when:** at least the Claude Code and Copilot listings are live and install-tested from a clean machine. *(Not yet — these are external, account-gated submissions outside what this session can perform.)*

---

## Phase 3 — v1.5

### 3.1 `packages/rules-static-html`

Foundation for Power Pages later (§2.2 — "same walker, two consumers"), so build it as a library + pack, not just a pack.

- [ ] DOM-tree walker over parse5/linkedom; checks per §2.2: landmarks, `alt`, label/`for` pairing, heading order, `lang`, skip links.
- [ ] Export the walker's node-visitor API publicly (`rules-power-pages` will extend it in P7).
- [ ] Framework-detector: static-HTML detection = plain `.html` files + no framework dependency (fallback ordering after all framework checks).
- [ ] Standard mapping-table + fixture regime.

### 3.2 `packages/rules-vue`

- [ ] Wrap `eslint-plugin-vuejs-accessibility` via `vue-eslint-parser` (§2.2); detection: `.vue` SFCs or `vue` dep. Mapping table + fixtures as always.

### 3.3 Metadata-driven `A11Y.md` generation (§2.3a)

- [ ] Replace the static template: `context-gen` now assembles `A11Y.md` from the rule packs' mapping tables (rule → guidance line), filtered by detected framework (+ surface once P5 lands), honoring the active profile. **Prevention and audit share one source of truth — they can never drift** (§2.3a).
- [ ] Regeneration flow: re-running `a11y init` updates the generated block (fenced by markers) without touching user-added content.
- [ ] Resolve Open Question 5 before building: own format vs. fecarrico/mgifford-compatible conventions (hybrid — own generator, their file conventions — is the design's leaning). Record the decision in DESIGN.md.

### 3.4 `packages/hooks-precommit`

- [ ] Husky/lefthook config + runner: fast Layer 1 pass on **staged files only** (§12.3 — change-scoped, never whole-repo), honoring baseline + profile. `a11y init --with-precommit` installs it.
- [ ] Host-independent enforcement for Cursor/Copilot/Codex users (§4.3 substitute).

**Phase done when:** Vue and static-HTML fixture projects audit correctly; regenerated A11Y.md diffs only when rule metadata changes; pre-commit blocks a staged seeded violation but not pre-existing ones.

---

## Phase 4 — v1.6

### 4.1 `packages/rules-angular` / `packages/rules-svelte`

- [ ] Angular: `@angular-eslint/template` a11y rules over `*.component.html` (§2.2); detection via `angular.json`.
- [ ] Svelte: `eslint-plugin-svelte` **plus capture the Svelte compiler's own `a11y-*` warnings** rather than re-implementing them (§2.2 note) — run a compile pass, translate warnings → findings.
- [ ] Mapping tables + fixtures, as always.

### 4.2 Claude Code hooks (§2.3d)

Ship inside `.github/plugins/a11y/hooks/`, strictly opt-in via `a11y-init --with-hooks`.

- [ ] **UserPromptSubmit hook**: classify prompt as UI-touching (file-type mentions, component vocabulary); if so, inject the relevant Layer 0 context (topic guide selection mirrors the router's table).
- [ ] **PreToolUse hook**: on Edit/Write targeting UI file types (`.tsx .jsx .vue .svelte .html`, Liquid, `ControlManifest.Input.xml`), run the fast Layer 1 pass on the **pending content** (post-edit text, change-scoped per §12.3); violations → `permissionDecision: "deny"` with findings as the reason (§2.3d).
- [ ] Performance budget: the PreToolUse pass must complete in low single-digit seconds (single-file lint, warm process if possible) — an enforcement hook that feels slow gets uninstalled.
- [ ] Safety documentation in `docs/safety-and-guardrails.md`: exactly what the gate can block and how to bypass/disable.
- [ ] Evals: hook denies a seeded-violation write with a useful message; allows the corrected version; never fires on non-UI files.

**Phase done when:** all four framework packs pass fixtures; hooks demo cleanly in a live session and are absent unless opted into.

---

## Phase 5 — v2

### 5.1 `packages/surface-detector`

- [ ] Implement `SurfaceAdapter.detect()` heuristics per §2.1 table: PCF = `ControlManifest.Input.xml`; Code Apps = `power.config.json`/PAC markers (P6 activates it); Power Pages = `power-pages/**`/`.portalconfig.json`/Liquid files (P7 activates it); Web App = fallback.
- [ ] Multi-surface repos (e.g. monorepo with a PCF control and a web app): detection is per-directory-tree, results are a list, each audited with its own adapter.

### 5.2 PCF adapter + `packages/rules-pcf` (Layer 3 first use)

- [ ] **JSON DSL engine in `core`** (deferred from P1 since nothing needed it until now): rule shape per §5 (`ruleId`, `target`, `severity`, WCAG fields, `condition`, `message` with `{{placeholders}}`), plus the **`surface` key** (§2.1 design implication — engine is multi-tenant, each surface contributes `rules/<surface>.json`).
- [ ] Condition evaluators for XML targets: XPath-like selectors over `ControlManifest.Input.xml` and Dataverse form XML; evaluator types `control-property`, `attribute-present`, `attribute-value`, extensible via registry.
- [ ] Rule content (§5 sizing: ~12 PCF manifest + ~8 Dataverse form XML): missing accessible name on bound properties, no keyboard handler declared for canvas-drawn controls (§2.1), form XML label/description gaps.
- [ ] Layer 2 for PCF: axe against the local test harness (`npm run start:watch`, §2.1) — reuse the generic URL mode with a documented launch recipe.
- [ ] Flesh out the `a11y-pcf` topic skill (guide content replaces the P1 stub) + new `dataverse-forms` reference guide content.
- [ ] Fixtures: seeded-violation manifests + form XML with exact expected findings.

**Phase done when:** a real PCF project audits across Layers 1–3 with one command; DSL engine loads multiple surface rule files simultaneously.

---

## Phase 6 — v3

### 6.1 Code Apps adapter + `packages/rules-code-apps`

- [ ] Detection per §2.1 (PAC markers); Layer 1 = existing react+fluent packs; Layer 2 = local dev server URL.
- [ ] Layer 3 DSL rules for generated CRUD/grid patterns (§2.1): sortable column headers announced, pagination controls labeled, empty-state/loading announcements on data-bound screens.
- [ ] Decide (Open Question 2 follow-up) whether to add a `pac code run` launch recipe or stay URL-only.

### 6.2 Cursor marketplace + optional VS Code extension

- [ ] Cursor: submit when their marketplace opens (tracked task, external dependency).
- [ ] VS Code extension **only if** tasks.json + SARIF Viewer prove insufficient (§10 — deliberately deferred): thin CLI→diagnostics bridge, no logic of its own (§4 packaging principle). Gate this on real user feedback, not completeness instinct.

**Phase done when:** a Code Apps sample project audits end-to-end including the CRUD rules.

---

## Phase 7 — v4

### 7.1 Power Pages adapter + `packages/rules-power-pages`

- [ ] **Extends `rules-static-html`'s walker** (§2.2 key reuse point — do not write a second DOM walker): add Liquid tag tolerance to parsing, plus entity form/list metadata rules on top.
- [ ] Layer 1: Liquid/HTML static parse per §2.1 (missing `lang`, heading order, label/`for`, skip links — inherited from static-html; Liquid-specific additions on top).
- [ ] Layer 3 DSL rules: entity list/form metadata (missing column accessible names, skip nav on portal templates, default-theme contrast — §2.1).
- [ ] Layer 2: axe crawl of the **published or preview site URL** (§2.1 — the most reliable layer here). Implement Open Question 3's hybrid: source scan as PR gate, live-URL scan as post-deploy check — both modes documented.
- [ ] **Severity policy:** Power Pages findings get the higher-default-severity treatment (§2.1 caveat — public-facing legal exposure); encode as a surface-level severity floor in the aggregator, visible in reports.
- [ ] Flesh out `a11y-pages` topic skill + liquid-templates reference guide; tie into the docs generator per §10.

**Phase done when:** a portal project gets a source-scan PR gate and a live-crawl report, with portal findings visibly prioritized.

---

## Cross-cutting workstreams (run alongside all phases)

| Workstream | Cadence | Notes |
|---|---|---|
| **Dogfooding** (§9) | every CI run from P1.9 | audit our own code; from P2.2, also our own HTML report output |
| **Rule-reference regeneration** (P1.6) | CI check, every PR | generated docs never drift from metadata |
| **Skill validation** (`skills-ref validate`) | CI, every PR | frontmatter/naming spec compliance for all nine skills |
| **Golden files & fixtures** | grow with every rule | a rule without a fixture asserting exact findings is not done |
| **Changelogs/versioning** | per publish | changesets; rule packs version independently (§8) |
| **Open Questions** (§DESIGN) | resolve before the phase that needs them | OQ1 (repo split) before P5 publishes packs; OQ2 (launch modes) at P2.3; OQ3 (Pages scan priority) at P7; OQ5 (A11Y.md format) at P3.3 |

---

## Definition of Done (project-level, per phase release)

1. All phase checkboxes complete; fixtures assert exact findings for every shipped rule.
2. `docs/rule-reference.md` regenerated; README install/usage current for every affected host.
3. Dogfooding CI green — including the HTML reporter's own accessibility test from P2 onward.
4. npm packages + plugin manifests version-bumped and published together.
5. A human has run the headline skill flow (`/a11y-audit` or the phase's new capability) in a live agent session against a real project — not only fixtures.
