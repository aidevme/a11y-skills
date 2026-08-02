# a11y-skills — High-Level Design

**Status:** Draft
**Scope:** React / Node / Fluent UI (v9) accessibility auditing as a **multi-agent plugin + skillset**, structured per the microsoft/Dataverse-skills convention — natively installable in GitHub Copilot, Claude Code, Codex and Cursor, usable from VS Code and CI via the CLI — plus a Power Platform / PCF / Power Pages / Code Apps extension pack.

> Naming note: repo renamed from `claude-a11y-skillset` → **`a11y-skillset`** (npm scope `@aidevme/a11y`) — "claude-" in the name would undersell the Copilot/Cursor/Codex support that §4 now makes first-class.

---

## 1. Problem & Goals

No AI coding agent (Claude Code, Copilot, Cursor, Codex) has a built-in accessibility auditing skill. Existing community skills (axe-core + jsx-a11y wrappers) cover generic React but nothing understands **Fluent UI v9's** own ARIA behavior, or **PCF controls / Dataverse model-driven forms**, where accessibility bugs are common and expensive (Section 508 / EN 301 549 obligations for enterprise clients).

**Goals**
1. A static + runtime a11y audit skill any supported agent can invoke on demand (`/a11y-audit`) or as a pre-PR gate.
2. A rule-pack architecture so Fluent UI and PCF/Dataverse checks are additive, not baked into a monolith.
3. Machine-readable output (SARIF) for GitHub code scanning, a human-readable Markdown report, and a self-contained HTML report as client deliverable.
4. Reuse the declarative JSON DSL pattern from your Solution Health Checker, so the same mental model (and possibly contributors) carries over.
5. **Prevention, not just detection** (inspired by fecarrico/A11Y.md, mgifford/ACCESSIBILITY.md, Community-Access/accessibility-agents): a governance/context layer that conditions the AI to write accessible code *before* generation, with optional hard enforcement via Claude Code hooks — so the audit layers become a safety net, not the first line of defense.

**Non-goals (v1):** visual regression testing, color-blindness simulation, full screen-reader emulation.

---

## 2. Architecture Overview

Four layers. **Layer 0 is preventive** (governs code generation); a **Surface Detector** then picks which adapter(s) apply for the three **detective** layers (audit):

```
┌───────────────────────────────────────────────────────────────┐
│        Agent skills (Copilot / Claude Code / Codex / Cursor)   │
│     a11y-overview routes → a11y-audit / a11y-init / a11y-fix    │
└──────────────────────────────┬─────────────────────────────────┘
                                │
        ┌──────────────────────▼────────────────────────────┐
        │  Layer 0: Prevention & Governance   [NEW]          │
        │  • A11Y.md context file (per-project, generated)    │
        │  • Compliance profiles: AAA / AA / A                │
        │  • Lazy-loaded APG reference guides (on-demand)     │
        │  • Optional hooks: PreToolUse gate on UI file edits │
        └──────────────────────┬────────────────────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   Surface Detector       │
                    │  (which of the 4 targets │
                    │   is this repo/folder?)  │
                    └─┬──────┬──────┬──────┬──┘
                      │      │      │      │
              PCF ────┘      │      │      └──── Web App (generic)
                     Code Apps      Power Pages
                      │      │      │      │
        ┌─────────────▼──────▼──────▼──────▼──────────────┐
        │  Layer 1: Static Analysis                         │
        │  (ESLint/jsx-a11y core + surface-specific packs   │
        │   + Liquid/HTML parser for Power Pages)           │
        └──────────────────────┬────────────────────────────┘
                                │
        ┌──────────────────────▼────────────────────────────┐
        │  Layer 2: Runtime DOM                              │
        │  (axe-core via Playwright — Storybook, Code Apps   │
        │   preview, Power Pages published site, or any URL) │
        └──────────────────────┬────────────────────────────┘
                                │
        ┌──────────────────────▼────────────────────────────┐
        │  Layer 3: Domain Rules (JSON DSL engine)           │
        │  (PCF manifest, Dataverse forms, Power Pages       │
        │   entity lists/forms, Code Apps data-bound grids)  │
        └──────────────────────┬────────────────────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   Report Aggregator     │
                    │ → SARIF+MD+JSON+HTML    │
                    └─────────────────────────┘
```

- **Layer 1 (static):** `eslint-plugin-jsx-a11y` as the base for anything React-shaped (Web Apps, Code Apps), plus `eslint-plugin-fluent-a11y` (Fluent UI v9 semantics), plus a **Liquid/HTML static parser** for Power Pages templates where ESLint doesn't apply.
- **Layer 2 (runtime):** headless Playwright + axe-core — points at a Storybook build, a Code Apps local preview, or a **published/staged Power Pages URL** directly, since portals are the one surface you can always just crawl live. Three conformance-model-driven checks beyond a plain axe pass (all derived from normative WCAG 2.1 requirements): **(a) multi-viewport scanning** — WCAG conformance is per full page *including every responsive variant* (5.2.2 Note 3), and SC 1.4.10 Reflow specifically requires no 2D scrolling at 320 CSS px width, so the harness scans each page at a viewport matrix (320px, tablet, desktop) rather than desktop-only; **(b) text-spacing override test** (SC 1.4.12) — inject the specified line-height/letter/word-spacing values via CSS and assert no content loss; **(c) orientation check** (SC 1.3.4) — portrait and landscape.
- **Layer 3 (domain):** the JSON DSL engine, with one rule set per surface: PCF `ControlManifest.xml`, Dataverse form XML, **Power Pages entity list/form metadata**, and **Code Apps generated CRUD screen patterns**.

All layers emit a common internal finding schema; a single aggregator converts to SARIF/Markdown/JSON so CI, PRs, and chat all read the same shape regardless of surface.

---

## 2.1 Surface Adapters

Each target gets an **adapter**: detection heuristic + which layers/packs apply. This is the extension point — new surfaces (e.g. a future Copilot Studio canvas) are added here without touching core.

| Surface | Detected by | Tech reality | Layer 1 | Layer 2 | Layer 3 |
|---|---|---|---|---|---|
| **PCF control** | `ControlManifest.Input.xml` present | TypeScript, may or may not use React/Fluent | jsx-a11y + fluent-a11y (if React-based) | axe-core against test harness (`npm run start:watch`) | PCF manifest rules: missing accessible name on bound properties, no keyboard handler on custom canvas-drawn controls |
| **Power Apps Code Apps** | `power.config.json` / PAC CLI project markers, `pac code` scaffold | React + TypeScript, Fluent UI, Dataverse Web API via generated SDK | jsx-a11y + fluent-a11y (same as Web App) | axe-core against local dev server | New: generated CRUD/grid rules — sortable column headers, pagination controls, empty-state/loading announcements on data-bound screens |
| **Power Pages** | `power-pages/**` folder, `.portalconfig.json`, or Liquid template files (`.html` with `{% %}` tags) | Liquid templates + Bootstrap-based portal components + entity forms/lists (config-driven, not code-driven) | Liquid/HTML static parser (custom — no JSX here) — missing `lang`, heading order, form label/`for` pairing, skip links | axe-core crawl of the **published or preview site URL** — often the most reliable layer here since so much is server-rendered/config-driven | Entity List/Form metadata rules: missing column accessible names, WCAG-required skip nav on portal templates, contrast in default portal themes |
| **Web App (generic React/Node)** | fallback when none of the above markers exist | plain React/Node, any UI kit | jsx-a11y + fluent-a11y if Fluent detected, else generic React rules | axe-core against dev/Storybook build | none by default (no domain layer needed) — this is the "core" case the other three extend |

**Design implication:** Layer 3's JSON DSL engine becomes genuinely multi-tenant — each surface contributes its own rule file (`rules/pcf.json`, `rules/power-pages.json`, `rules/code-apps.json`) loaded by the same engine, rather than one hardcoded PCF/Dataverse rule set. This is the one change from the original v1 design worth calling out: Layer 3 needs a `surface` key in its rule schema so the engine knows which adapter a rule belongs to.

**Power Pages caveat:** because portals are frequently legally in scope for public accessibility statements (unlike internal model-driven apps), treat Power Pages findings as a distinct, higher-default-severity category in the reporter — a missed `alt` on an internal PCF control and a missed `alt` on a public-facing portal page are not the same risk.

---

## 2.2 Framework Adapters (Layer 1 — a second, orthogonal axis)

The Surface axis (§2.1) answers *"is this PCF / Code Apps / Power Pages / plain Web App?"* — it decides Layer 2/3 targets and domain rules. A separate, orthogonal **Framework axis** answers *"what does Layer 1's static parser need to understand?"* — and this is the one that lets you plug in React, Vue, Angular, Svelte, or plain static HTML, in any surface.

Every surface picks a framework adapter for its own Layer 1:

| Framework | Detected by | Static parser / rule pack | Notes |
|---|---|---|---|
| **React** | `.jsx`/`.tsx` files, `react` in `package.json` | `eslint-plugin-jsx-a11y` (+ `fluent-a11y` if Fluent UI detected) | Already designed; this is what Code Apps and generic React Web Apps use |
| **Vue** | `.vue` SFCs, `vue` in `package.json` | `eslint-plugin-vuejs-accessibility` via `vue-eslint-parser` | Template-block a11y rules (missing `alt`, `v-html` misuse hiding semantics, etc.) |
| **Angular** | `angular.json`, `*.component.html` templates | `@angular-eslint/template` + a11y template rules | Runs against separate template files, not inline JSX |
| **Svelte** | `.svelte` files | `eslint-plugin-svelte` | Bonus: the **Svelte compiler itself emits `a11y-*` warnings** at build time — capture those directly rather than re-implementing checks |
| **Static HTML** (no framework) | plain `.html` files, no framework dependency in `package.json` | new `rules-static-html`: a DOM-tree walker (parse5/linkedom) checking landmarks, `alt`, label/`for` pairing, heading order, `lang` attribute, skip links | No JS framework to hook into — this is pure markup analysis |

**Key reuse point:** Power Pages' Layer 1 (§2.1) is Liquid + Bootstrap-rendered HTML — i.e. it's *Static HTML plus Liquid template tags*. Rather than writing a second DOM-walker, `rules-power-pages` should **depend on and extend `rules-static-html`**, adding only the Liquid-specific bits (entity form/list metadata) on top. Same walker, two consumers.

**Layer 2 stays framework-agnostic — this is the highest-leverage part of the design.** axe-core operates on the *rendered DOM*, so it doesn't care whether React, Vue, Angular, Svelte, or nothing produced that DOM. For static HTML you don't even need a dev server — point Playwright at the file directly or a one-line `http-server`. Practical implication: **any new framework gets real accessibility coverage on day one with zero new code**, just by serving it and running Layer 2. Layer 1 rule packs are an *optimization* (faster, no server needed, inline PR annotations) that you add per-framework over time — not a blocker to using the tool.

**Framework adapter interface** (so adding "etc." — Solid, Qwik, whatever's next — is a small, contained change):

```typescript
interface FrameworkAdapter {
  id: string;                          // "react" | "vue" | "static-html" | ...
  detect(projectRoot: string): boolean;  // marker-file / dependency check
  lint(files: string[]): Finding[];      // Layer 1 static pass
  devServerCommand?: string;             // optional: how to boot it for Layer 2
}
```

`core` iterates registered adapters, picks the first (or all) that `detect()` true, and runs their `lint()`. A new framework is a new package implementing this interface plus a registration line — nothing in `core`, the reporters, or the Surface axis needs to change.

---

## 2.3 Layer 0 — Prevention & Governance (new, inspired by found repos)

The audit layers (1–3) catch problems *after* code exists. Layer 0 conditions the AI (Claude Code, Cursor, Copilot) to not produce those problems in the first place. Three sub-components, each adopted from a proven community pattern:

### a) Generated `A11Y.md` context file (pattern: fecarrico/A11Y.md)

The **`a11y-init`** skill (backed by `npx @aidevme/a11y init`) that generates a project-tailored `A11Y.md` at repo root — not a static copy, but assembled from the same rule metadata the audit layers use, filtered by detected surface + framework. A PCF project gets PCF-relevant rules in its context file; a Power Pages project gets portal/Liquid guidance. This is the unique twist over the community originals: **the prevention file and the audit rules share one source of truth**, so they can never drift apart. The generated file ends with the standard one-line hook for `.cursorrules` / `CLAUDE.md` / `AGENTS.md` / `copilot-instructions.md`, keeping it agent-agnostic like the originals.

### b) Compliance profiles (pattern: A11Y.md's Shield/Standard/Launchpad)

`.a11yrc.json` gains a `profile` key that drives **both** Layer 0 content and Layer 1–3 severity mapping:

| Profile | Target | Behavior |
|---|---|---|
| `strict` | AAA | All rules error; hooks enforcement recommended (note: W3C itself advises against requiring AAA site-wide — some content cannot satisfy all AAA criteria, so `strict` is for components/pages, not blanket policy) |
| `standard` | AA (default) | AA rules error, AAA rules warn |
| `mvp` | A | Visual/contrast rules relax to warnings; **semantic structure rules never relax** (the Launchpad insight: you can defer polish, never markup semantics) |

The profile additionally takes a **`wcagVersion`** parameter (`2.0` | `2.1` | `2.2`, default `2.2`), filtering rules by the version metadata in §5 — this matters legally: **EN 301 549 currently references WCAG 2.1 AA** (not 2.2), while newer policies target 2.2, so a DACH/Benelux client engagement can pin `{"profile": "standard", "wcagVersion": "2.1"}` and get exactly its contractual scope. Backwards compatibility makes this safe: content conforming to 2.1 also conforms to 2.0, and 2.2's additions are additive.

**Non-interference floor (WCAG 5.2.5):** four criteria — 1.4.2 Audio Control, 2.1.2 No Keyboard Trap, 2.2.2 Pause/Stop/Hide, 2.3.1 Three Flashes — must be met by *all* content on a page, even content not otherwise relied on for conformance, because violations can make the entire page unusable. Rules mapped to these four are therefore **never relaxed by any profile and never accepted into a baseline** (§12) — they're the floor under the floor.

One profile switch reconfigures the entire stack — the generated `A11Y.md`, ESLint severities, and DSL rule severities all read the same key.

### c) Lazy-loaded reference guides (pattern: A11Y.md's 21 APG guides + mgifford/accessibility-skills topic split)

A `references/` directory of topic-specific guides (forms, dialogs/modals, grids-and-tables, keyboard-navigation, focus-management, live-regions, liquid-templates, pcf-controls…), each a standalone SKILL.md-style file. The main skill instructs Claude to load only the guide(s) relevant to the current task — token-efficient, and each guide doubles as human documentation. Power Platform-specific guides (pcf-controls, dataverse-forms, portal-templates) are the differentiator no community repo has.

### d) Optional hooks enforcement (pattern: Community-Access/accessibility-agents)

For teams that want prevention to be *mandatory* rather than advisory, an opt-in `hooks/` package ships two Claude Code hooks:

- **UserPromptSubmit** — detects UI-touching prompts and injects the relevant Layer 0 context automatically, so accessibility guidance survives even in long sessions where CLAUDE.md context gets deprioritized.
- **PreToolUse** — gates Edit/Write on UI file types (`.tsx`, `.jsx`, `.vue`, `.html`, Liquid templates, `ControlManifest.Input.xml`) until a fast Layer 1 lint pass on the pending change comes back clean, using `permissionDecision: "deny"` with the violations as the denial reason — turning findings into an inline feedback loop rather than a post-hoc report.

Hooks are strictly opt-in (`a11y-init --with-hooks`): they add friction that's right for compliance-bound client projects and wrong for prototyping.

### Prevention ↔ detection loop

The full lifecycle this enables: `init` (generate context + optional hooks) → AI writes code under Layer 0 governance → hooks catch violations inline → `a11y-audit` (Layers 1–3) as PR gate → SARIF into GitHub → findings feed back into the next `A11Y.md` regeneration if new rule packs were added. Detection results validate prevention effectiveness — if the audit keeps finding the same rule violated, that rule's Layer 0 guidance needs strengthening.

---

## 3. Repo Structure

**Adopted from microsoft/Dataverse-skills** (the emerging Microsoft-blessed convention for multi-agent skill repos) — with one structural difference: their repo wraps *existing* CLIs (PAC, Dataverse CLI), so it's skills-only; ours ships its own audit engine, so we keep `packages/` alongside the plugin layout.

```
a11y-skillset/
├── .github/
│   ├── plugins/a11y/            # ★ CANONICAL plugin source (Dataverse-skills convention)
│   │   ├── skills/
│   │   │   ├── a11y-overview/   # cross-cutting rules + routing; loaded first
│   │   │   │   └── SKILL.md     #   (mirrors their dv-overview pattern; router only,
│   │   │   │                    #   no optional dirs — it has no content to reference)
│   │   │   ├── a11y-audit/      # main audit orchestrator (Layers 1–3 via CLI)
│   │   │   │   ├── SKILL.md
│   │   │   │   ├── scripts/     #   thin CLI-invocation wrappers
│   │   │   │   ├── references/  #   rule-pack summaries, output-format notes
│   │   │   │   ├── assets/      #   sample SARIF/HTML report snippets
│   │   │   │   └── evals/       #   does audit drive the CLI correctly?
│   │   │   ├── a11y-init/       # Layer 0: generate A11Y.md + profiles + host wiring
│   │   │   │   ├── SKILL.md
│   │   │   │   ├── scripts/     #   host-detection + config-writer wrappers
│   │   │   │   ├── references/  #   profile definitions (strict/standard/mvp)
│   │   │   │   ├── assets/      #   A11Y.md / AGENTS.md templates
│   │   │   │   └── evals/       #   correct host files generated per detected agent?
│   │   │   ├── a11y-fix/        # remediation: take findings → propose/apply diffs
│   │   │   │   ├── SKILL.md
│   │   │   │   ├── scripts/     #   diff-proposal helpers
│   │   │   │   ├── references/  #   fix pattern per rule ID
│   │   │   │   ├── assets/      #   before/after code snippets
│   │   │   │   └── evals/       #   does fix propose a valid, minimal diff?
│   │   │   ├── a11y-forms/      # ┐
│   │   │   │   ├── SKILL.md     # │
│   │   │   │   ├── references/  # │ topic reference skills (lazy-loaded guides, §2.3c),
│   │   │   │   ├── assets/      # │ incl. Power Platform-specific: pcf, dataverse-forms,
│   │   │   │   └── evals/       # │ code-apps, power-pages/liquid. No scripts/ here —
│   │   │   ├── a11y-dialogs/    # │ these are docs-only guides, nothing to execute.
│   │   │   │   ├── SKILL.md     # │
│   │   │   │   ├── references/  # │
│   │   │   │   ├── assets/      # │
│   │   │   │   └── evals/       # │
│   │   │   ├── a11y-keyboard/   # │
│   │   │   │   ├── SKILL.md     # │
│   │   │   │   ├── references/  # │
│   │   │   │   ├── assets/      # │
│   │   │   │   └── evals/       # │
│   │   │   ├── a11y-pcf/        # │
│   │   │   │   ├── SKILL.md     # │
│   │   │   │   ├── references/  # │
│   │   │   │   ├── assets/      # │
│   │   │   │   └── evals/       # │
│   │   │   └── a11y-pages/      # ┘ power-pages/liquid
│   │   │       ├── SKILL.md
│   │   │       ├── references/
│   │   │       ├── assets/
│   │   │       └── evals/
│   │   └── hooks/               # Claude Code hooks (PreToolUse gate, prompt inject)
│   └── workflows/ci.yml         # dogfood: run the skill on itself
├── .claude-plugin/              # Claude Code plugin manifest → canonical source
├── .cursor-plugin/              # Cursor plugin manifest → canonical source
├── .agents/plugins/             # generic agents (Codex etc.) manifest → canonical source
├── .azdo/                       # Azure DevOps pipeline (they ship this too — and it
│                                #   fits your CI/CD documentation background perfectly)
├── packages/                    # ★ OUR ADDITION: the audit engine (they have no engine)
│   ├── core/                    # finding schema, aggregator, CLI (@aidevme/a11y)
│   ├── context-gen/             # [L0] A11Y.md + host-config generation
│   ├── hooks-precommit/         # [L0] host-independent husky/lefthook gate
│   ├── surface-detector/        # PCF / Code Apps / Power Pages / Web App
│   ├── framework-detector/      # React / Vue / Angular / Svelte / Static HTML
│   ├── rules-react/ rules-vue/ rules-angular/ rules-svelte/ rules-static-html/
│   ├── rules-fluent-ui/ rules-pcf/ rules-code-apps/ rules-power-pages/
│   └── runtime-axe/             # Playwright + axe-core harness
├── reporters/
│   ├── sarif/  markdown/  html/
├── references/                  # CROSS-skill shared source (WCAG criteria data, shared
│                                #   style/terminology) — distinct from the per-skill
│                                #   references/ above, which hold topic-specific guides
├── evals/tests/                 # ★ from their layout: agent-level eval scenarios
│                                #   ("does a11y-overview route to the right skill?"),
│                                #   distinct from each skill's own evals/ (does *that*
│                                #   skill behave correctly in isolation) and from unit
│                                #   tests in packages/*
├── examples/                    # per-surface/framework violation fixtures (unchanged)
├── docs/
│   ├── DESIGN.md
│   ├── safety-and-guardrails.md # their docs convention — ours covers what the hooks
│   │                            #   may block and what the CLI reads/transmits (nothing)
│   └── rule-reference.md        # generated from rule metadata
├── CLAUDE.md  CODEOWNERS  CODE_OF_CONDUCT.md  CONTRIBUTING.md
├── LICENSE (MIT)  README.md  SECURITY.md  SUPPORT.md
└── package.json                 # npm workspaces
```

Three things adopted wholesale from Dataverse-skills beyond the folder layout:

1. **The `*-overview` routing skill** — one skill with cross-cutting rules loaded before any other, directing each request to the right specialist (audit vs. init vs. a topic guide). This replaces ad-hoc trigger phrases scattered across individual skills with a single router — much cleaner as the skill count grows.
2. **Skill naming convention** — short prefixed names (their `dv-query`, `dv-metadata` → our `a11y-audit`, `a11y-pcf`), keeping slash-command invocation unambiguous when multiple plugins are installed side by side.
3. **`evals/tests` as a first-class top-level concern** — agent-behavior evals (does the router pick the right skill? does the audit skill drive the CLI correctly?) separate from engine unit tests in `packages/`.

---

## 4. Distribution: Plugin + Portable Skills, Multi-Agent by Design

**Packaging principle:** the intelligence lives in three portable, agent-agnostic artifacts — (1) the **CLI** (`@aidevme/a11y` npm package: all audit logic, exit codes, SARIF/MD/JSON out), (2) **SKILL.md files** (orchestrator + reference guides, plain Markdown), (3) the generated **A11Y.md / AGENTS.md context files**. Everything agent-specific is a *thin wrapper* around these three. This is what makes "works in VS Code, Copilot CLI, Claude Code, Cursor, Codex etc." cheap: no logic is ever reimplemented per host.

### 4.1 Per-host integration matrix

**Install model (validated by microsoft/Dataverse-skills):** one canonical plugin source in `.github/plugins/a11y/`, installed natively per host — no manual file copying for the four plugin-capable hosts.

| Host | Install | What it gets | Notes |
|---|---|---|---|
| **GitHub Copilot** | `/plugin install a11y@awesome-copilot` (submit to the awesome-copilot marketplace) | Skills + audit via CLI | Copilot's plugin system consumes the same skills source |
| **Claude Code** | `/plugin install a11y@claude-plugins-official` (or our own marketplace repo as source) | Full experience: all skills + PreToolUse gate + prompt-inject hooks | Only host with hooks |
| **Codex** | `codex plugin marketplace add aidevme/a11y-skillset` then install from the marketplace | Skills + audit via CLI | Repo itself acts as the marketplace, as Dataverse-skills does |
| **Cursor** | Copy `.github/plugins/a11y` → `~/.cursor/plugins/local/a11y/` (until marketplace listing; Dataverse-skills has the same interim state) | Skills + audit via CLI | `a11y-init` can also emit a `.cursorrules` pointer as belt-and-braces |
| **VS Code (no agent / any agent)** | CLI directly: tasks.json task, npm script, or SARIF Viewer; optional thin extension later | Audit layers; Layer 0 via whichever assistant reads the context files | Extension deliberately deferred (see phasing) |
| **CI (agent-independent)** | GitHub Action + `.azdo/` Azure DevOps pipeline wrapping the same CLI | Audit as PR gate | Azure DevOps template included per the Dataverse-skills precedent — and it's the pipeline most Power Platform shops actually run |

The `a11y-init` generator (§4.2) still writes `A11Y.md` + context-file pointers (`.cursorrules`, `copilot-instructions.md`, `AGENTS.md`) — but its role narrows to **Layer 0 project wiring**, while plugin installation handles skill distribution. The two are complementary: install the plugin once per machine; run init once per project.

### 4.2 The generator writes all host configs at once

`/a11y init` (or `npx @aidevme/a11y init` outside Claude Code) detects which hosts are present (`.cursorrules`? `.github/copilot-instructions.md`? `.claude/`? `AGENTS.md`?) and writes/updates the matching pointer snippet for each — so one command wires up every assistant the team uses. All snippets point to the same generated `A11Y.md`, keeping a single source of truth per project regardless of how many agents touch it.

### 4.3 Degradation model

Not every host supports every layer — the design degrades gracefully rather than requiring the full stack:

| Capability | Claude Code | Copilot CLI | Cursor | Codex | Bare VS Code / CI |
|---|---|---|---|---|---|
| Layer 0 context | ✅ plugin/skills | ✅ instructions file | ✅ rules file | ✅ AGENTS.md | ➖ (needs an AI assistant) |
| Lazy reference guides | ✅ native skill loading | ⚠️ inline references in instructions | ⚠️ same | ✅ where SKILL.md supported | ➖ |
| Audit (L1–L3) via CLI | ✅ | ✅ | ✅ | ✅ | ✅ |
| Enforcement hooks | ✅ | ❌ (substitute: pre-commit hook via husky — host-independent) | ❌ (same substitute) | ❌ (same) | ✅ pre-commit / CI gate |

The pre-commit substitute matters: since only Claude Code has PreToolUse, the `hooks/` package also ships a plain **git pre-commit hook** (husky/lefthook config) running the fast Layer 1 pass — giving every host *some* inline enforcement, with Claude Code getting the richer in-editor variant.

### 4.4 The skill definitions

Skills live in `.github/plugins/a11y/skills/` (§3) and stay thin orchestrators — all logic is in the CLI, so the same SKILL.md files work verbatim in every plugin-capable host. Two levels:

**`a11y-overview`** (router, dv-overview pattern): loaded first, holds cross-cutting rules (profile awareness, "always report WCAG refs", severity language) and routes each request — "audit this" → `a11y-audit`, "set up accessibility" → `a11y-init`, "fix these findings" → `a11y-fix`, "how do I make this dialog accessible" → `a11y-dialogs`.

**Specialist example** — `a11y-audit/SKILL.md`:

```yaml
---
name: a11y-audit
description: >
  Audits React, Vue, Angular, Svelte, static HTML, PCF, Power Apps Code Apps
  and Power Pages for WCAG 2.2 compliance. Runs static rules, optional runtime
  axe-core scan, and Power Platform domain checks via the @aidevme/a11y CLI.
  Trigger on "/a11y-audit", "check accessibility", "audit ARIA", "WCAG compliance".
allowed-tools: Read, Bash, Glob, Grep
---
```

Body: detect project shape via the CLI's detectors → run matching rule packs → summarize findings by severity → propose concrete diffs for the top N issues (not a report dump).

---

## 5. Rule Engine (Layer 3) — Config Shape

Following your Solution Health Checker's declarative style:

```json
{
  "ruleId": "pcf-missing-aria-label",
  "target": "ControlManifest.xml",
  "severity": "error",
  "wcagRef": "4.1.2",
  "wcagLevel": "A",
  "wcagVersion": "2.0",
  "condition": {
    "type": "control-property",
    "check": "no-associated-label",
    "controlTypes": ["standard", "virtual"]
  },
  "message": "PCF control '{{name}}' exposes no accessible name for assistive tech."
}
```

Per the May 2025 errata-incorporating WCAG 2.1 Recommendation, rule metadata carries three normative fields: `wcagRef` (success criterion), `wcagLevel` (A/AA/AAA — the SC's own conformance level, since WCAG 2.1 numbering no longer groups SCs by level within a guideline), and `wcagVersion` (2.0 / 2.1 / 2.2 — the version the SC first appeared in), so a profile can target exactly the version a client's legal obligation references.

**No rules map to SC 4.1.1 Parsing.** The updated Recommendation states 4.1.1 is considered always satisfied for HTML/XML content and "no longer provides any benefit" — issues like duplicate IDs breaking names/states are reported under 4.1.2 instead, exactly as the spec directs. This also means the engine should downgrade/ignore 4.1.1 findings bubbling up from third-party linters.

35+ rules is a reasonable v1 target, split roughly: 15 React/Fluent, 12 PCF manifest, 8 Dataverse form XML — matching the scale of your existing health-checker rule set.

---

## 6. Reporting

- **SARIF** — for GitHub Advanced Security code scanning, so violations show up as PR annotations.
- **Markdown** — for chat/CLI, grouped by severity → WCAG success criterion → file.
- **JSON** — raw findings for downstream tooling (e.g. feeding your `pp-solution-docs` generator or a dashboard).
- **HTML** — self-contained, single-file interactive report (`a11y-report.html`, inline CSS/JS, no external dependencies so it can be emailed or attached to a ticket). Contents: summary dashboard (findings by severity / WCAG criterion / surface, pass-fail per profile), filterable & sortable findings table, per-finding detail with code excerpt + remediation guidance + WCAG reference link, and trend comparison against a previous report file when one is supplied (`--compare previous.html`). Primary audiences: client-facing audit deliverables (the format consultants actually hand to stakeholders for EN 301 549 / Section 508 engagements — neither SARIF nor Markdown works for that), CI artifacts (uploaded per-run for non-developer review), and brownfield baseline reviews where a team triages hundreds of findings visually before committing a baseline file. **Obvious constraint: the report itself must be WCAG AA compliant** — an inaccessible accessibility report is disqualifying, so the HTML reporter's own output runs through Layer 2 (axe-core) as part of the reporter's test suite, i.e. the dogfooding gate from §9 extends to report output, not just source code.

All four render from the same internal finding schema — reporters are pure format transforms with no independent logic.

Two conformance-model additions (WCAG §5.2–5.3): findings and pass/fail summaries are grouped **per page** (conformance is per full page, never partial), with optional **process grouping** — WCAG 5.2.3 requires every page in a complete process (e.g. a portal checkout or Dataverse form wizard) to conform for any of them to conform, so the HTML report can mark a whole flow failed when one step fails. And since WCAG 5.3.2 permits machine-readable metadata in conformance claims, the JSON/HTML reporters can emit an optional **conformance-claim block** (date, version+level targeted, pages in scope, technologies relied upon) — turning an audit run into the skeleton of a formal accessibility statement, which is precisely the deliverable EN 301 549 engagements require.

---

## 7. CI/CD Integration

Ship as a **GitHub Action** (`aidevme/a11y-action`), same pattern as `pp-solution-docs`:

```yaml
- uses: aidevme/a11y-action@v1
  with:
    scope: react,fluent-ui,pcf
    fail-on: error
    report-format: sarif
```

Runs on PR; static layer always runs, runtime (Playwright) layer opt-in via a `runtime: true` flag since it needs a build/preview step.

An equivalent **Azure DevOps pipeline template** ships in `.azdo/` (Dataverse-skills precedent) — the pipeline most Power Platform delivery teams actually use, and directly reusable from your existing multi-stage Azure DevOps documentation work.

---

## 8. Versioning, Config & Extensibility

- `.a11yrc.json` at repo root — declares which rule packs are active (`react`, `fluent-ui`, `pcf-dataverse`), the **compliance `profile`** (`strict` | `standard` | `mvp`, see §2.3b — one switch drives Layer 0 content and Layer 1–3 severities together), and per-rule severity overrides, similar to `.eslintrc` layering.
- Each rule pack is an independent npm package under the same GitHub org (`aidevme`) so the PCF/Dataverse pack can be adopted without pulling in generic React tooling, and vice versa.
- Rule metadata (WCAG ref, severity, description) is the single source of truth — `docs/rule-reference.md` is generated from it, not hand-written.

---

## 9. Testing Strategy

- **Fixture-based**: `examples/` contains small apps/components with deliberately seeded violations (missing label, bad tab order, Fluent `Dialog` with clobbered `aria-modal`, a PCF manifest missing bound property labels). Each fixture asserts an exact expected-findings list — this is what actually proves the rule pack works, not just "does it run."
- **Golden-file SARIF/Markdown/JSON output** snapshot tests for the reporters; the HTML reporter additionally runs its own output through Layer 2 (axe-core) — see §6.
- **Agent evals** (`evals/tests/`, Dataverse-skills pattern): scenario tests that the `a11y-overview` router picks the right specialist skill and that `a11y-audit` drives the CLI correctly — behavior of the skills, separate from engine correctness.
- **Dogfooding**: run the skill on its own CLI/reporter code in CI.

---

## 10. Suggested Phasing

| Phase | Scope |
|---|---|
| **MVP** | Repo scaffolded in the **Dataverse-skills layout from day one** (canonical plugin source, `.claude-plugin`/`.cursor-plugin`/`.agents` manifests — near-zero cost at the start, expensive to retrofit). React framework adapter + Web App surface: Layer 1 (jsx-a11y + Fluent pack), Markdown reporter, **CLI as `@aidevme/a11y` npm package** (the portability foundation), `a11y-overview` router + `a11y-audit` + `a11y-init` skills, adapter registry interface. **+ Layer 0 minimal: static-template `A11Y.md` + first 4–5 reference-guide skills + host pointer snippets** |
| **v1** | + SARIF reporter, **+ HTML reporter** (client-deliverable — earns an early slot), GitHub Action + `.azdo/` pipeline, fixture test suite, first agent evals; + **Layer 2 (axe-core/Playwright)**; **+ compliance profiles**; **+ marketplace submissions**: claude-plugins-official, awesome-copilot, Codex marketplace (repo-as-marketplace) |
| **v1.5** | + `rules-static-html` + `rules-vue`; **+ metadata-driven `A11Y.md` generation**; **+ husky pre-commit hook** (host-independent enforcement for Cursor/Copilot/Codex users) |
| **v1.6** | + `rules-angular`, `rules-svelte`; **+ Claude Code hooks** (UserPromptSubmit inject + PreToolUse gate) inside the plugin |
| **v2** | + Surface Detector; + **PCF adapter**; + pcf-controls/dataverse-forms reference guides |
| **v3** | + **Power Apps Code Apps adapter**; + Cursor marketplace listing when available; **+ optional VS Code extension** (thin CLI→diagnostics bridge) if tasks.json + SARIF Viewer prove insufficient in practice |
| **v4** | + **Power Pages adapter**; liquid-templates reference guide; tie docs generator into `powerplatform-accessibility-docs` |

Note the reordering from earlier drafts: Layer 2 is pulled forward to v1 (framework-agnostic coverage for Vue/Angular/Svelte/static HTML before their Layer 1 packs exist); Layer 0's minimal form + multi-host snippets land in MVP because context files and pointer templates require no engine at all — the highest ratio of cross-ecosystem reach to build effort in the whole plan. The VS Code extension is deliberately deferred: it's the only host wrapper that requires real build/maintenance effort, and the CLI + SARIF path covers most of its value.

This phasing lets you ship something usable (and MVP-nominatable/bloggable) quickly, then layer in the Power Platform-specific value that differentiates it from the generic community skills already out there.

---

## 11. Tech Stack

TypeScript, npm workspaces, ESLint (custom rule packs), Playwright + axe-core, SARIF SDK (`@microsoft/sarif`), GitHub Actions. License: MIT, consistent with your other `aidevme` repos.

---

## 12. Adoption Paths: Greenfield vs. Brownfield

The toolkit supports both, with different entry flows:

**Greenfield (new project) — prevention-first.** Run `a11y-init` before writing UI code: it generates `A11Y.md`, wires up every detected assistant, and optionally installs hooks. Layer 0 governs code generation from the first line; the audit layers mostly confirm.

**Brownfield (existing project) — audit-first, ratchet up.** Run `a11y-audit` for a baseline, then improve incrementally:

1. **Baseline file** (`.a11y-baseline.json`): `npx @aidevme/a11y baseline` snapshots all current findings (rule + file + fingerprint hash, resilient to line-number drift). Baselined findings are *reported but non-failing*; anything new fails. This is the piece that lets a legacy codebase turn on `fail-on: error` on day one — without it, teams with hundreds of findings can't gate at all. The HTML report marks baselined vs. new findings distinctly, and `a11y baseline --prune` removes entries whose findings were fixed, so the baseline only ever shrinks. **Exception:** findings against the four non-interference criteria (§2.3b — keyboard traps, flashing, auto-playing audio, unstoppable movement) are never baseline-eligible; these can render an entire page unusable, so they fail immediately even in brownfield mode.
2. **Profile ratchet**: start on `mvp`, move to `standard` as debt burns down — one config change.
3. **Change-scoped gates**: the pre-commit and PreToolUse hooks check only the pending change, never the whole repo — no new violations enter, old ones don't block anyone.
4. **Delta visibility**: SARIF in GitHub code scanning tracks new/fixed/persistent per PR; `--compare` in the HTML reporter shows trend for stakeholders.

The two paths converge: once a brownfield project's baseline is empty, it operates exactly like a greenfield one.

---

## Prior Art & Attribution

Layer 0 patterns are adopted from (and should credit): **fecarrico/A11Y.md** (context protocol, compliance profiles, lazy APG guides), **mgifford/ACCESSIBILITY.md + accessibility-skills** (AGENTS.md-aligned format, topic-split skills, CI shift-left workflows, skill↔docs sync checks), **Community-Access/accessibility-agents** (hooks-based enforcement), **airowe/claude-a11y-skill** (static+runtime two-mode audit). The repo layout, multi-host install model, `*-overview` routing skill, naming convention, and evals structure follow **microsoft/Dataverse-skills** — a deliberate choice: matching the Microsoft-blessed convention makes the project instantly familiar to the Power Platform community (this repo's core audience), lowers the bar for contributors who know that repo, and doesn't hurt an MVP nomination narrative either. What this project adds that none of them have: Power Platform surfaces (PCF, Code Apps, Power Pages), Fluent UI v9 semantics, its own audit engine (Dataverse-skills wraps existing CLIs; we ship rule packs + runtime scanning), and a single rule-metadata source feeding both prevention and detection.

---

## Open Questions

1. Should each surface pack (`rules-pcf`, `rules-code-apps`, `rules-power-pages`) live in *this* repo as npm workspaces, or as sibling repos depending on `core` — given Power Pages consultants and pure Code Apps developers are fairly distinct audiences?
2. Runtime layer needs a running app/Storybook/URL — do you want one generic "point at a URL" mode across all four surfaces (simplest), or surface-specific launch commands (e.g. `pac code run` for Code Apps)?
3. For Power Pages, is scanning the **published site** (real, but requires a deployed environment) or the **local Liquid source** (available pre-deploy, but can't see final rendered Bootstrap/theme output) the priority for v4 — or both, with source scan as the PR gate and live scan as a post-deploy check?
4. Where does this plug into your MVP nomination story — worth naming it explicitly in the application/blog as a differentiator, especially since no existing community skill covers Power Pages or Code Apps at all?
5. **Layer 0 strategy question:** build the generated `A11Y.md` as our own format, or emit files *compatible with* the fecarrico/A11Y.md and mgifford/ACCESSIBILITY.md conventions (and possibly contribute the Power Platform reference guides upstream to mgifford/accessibility-skills)? Upstream compatibility means instant ecosystem fit and community goodwill (MVP-relevant); an own format means freedom to make it metadata-generated. A hybrid — own generator, their file conventions — may be the best of both.

   **Resolved (Phase 3, §2.3a/§3.3):** hybrid, as leaned toward above. The *generator* is ours — `context-gen` assembles the content entirely from each active rule pack's `rules-map.json` (ruleId, WCAG SC, summary) plus the active compliance profile, so prevention guidance and audit rules can never drift (single source of truth). The *file conventions* stay compatible with the community originals: plain Markdown, a single root-level `A11Y.md`, one generated section per detected framework, and the standard one-line pointer snippet dropped into whatever host config files exist (`CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `copilot-instructions.md`) — so it reads and installs the same way fecarrico/A11Y.md and mgifford/ACCESSIBILITY.md do. Content outside the marker-fenced generated block is always preserved verbatim on regeneration. Upstreaming the Power Platform guides to mgifford/accessibility-skills remains open — revisit once those guides exist (Phase 5+).
