# a11y-skills

Accessibility auditing as a multi-agent plugin + skillset: WCAG 2.2 static + runtime analysis for React and Fluent UI v9 today; Vue/Angular/Svelte/static HTML and Power Platform surfaces (PCF, Code Apps, Power Pages) on the [roadmap](docs/IMPLEMENTATION.md).

## Quickstart (CLI)

```bash
# audit the current project (Markdown report, exits 1 on error-level findings)
npx @aidevme/a11y audit

# JSON for tooling; never fail the process
npx @aidevme/a11y audit --format json --fail-on never

# CI-grade reports: SARIF for code scanning, self-contained HTML for stakeholders
npx @aidevme/a11y audit --format sarif --output a11y.sarif
npx @aidevme/a11y audit --format html --output a11y-report.html

# add the runtime (axe-core) layer against a running preview
npx @aidevme/a11y audit --runtime --url http://localhost:5173

# set up prevention: A11Y.md + .a11yrc.json + agent host pointers
npx @aidevme/a11y init

# brownfield adoption: snapshot current findings as non-failing, gate only new ones
npx @aidevme/a11y baseline
npx @aidevme/a11y baseline --prune   # drop entries for findings that got fixed
```

Exit codes: `0` clean or below threshold · `1` findings at/above `--fail-on` (default `error`) · `2` execution error. Findings against the four WCAG 5.2.5 non-interference criteria (keyboard traps, autoplaying audio, unstoppable flashing/motion) are never baseline-eligible and always fail, regardless of profile.

Configuration lives in `.a11yrc.json` (see `packages/core/schemas/a11yrc.schema.json`): compliance `profile` (`strict` | `standard` | `mvp`), `wcagVersion` (`2.0`–`2.2`), rule packs, per-rule overrides, `runtime.urls`/`viewports`, and named `processes` for multi-page conformance grouping.

## Install as an agent plugin

The canonical plugin source is `.github/plugins/a11y/` — skills: `a11y-overview` (router), `a11y-audit`, `a11y-init`, `a11y-fix`, plus topic guides (`a11y-forms`, `a11y-dialogs`, `a11y-keyboard`, `a11y-pcf`, `a11y-pages`).

| Host | Install |
| --- | --- |
| Claude Code | add this repo as a marketplace source, then `/plugin install a11y` |
| GitHub Copilot | consume the same skills source (awesome-copilot submission planned) |
| Cursor | copy `.github/plugins/a11y` → `~/.cursor/plugins/local/a11y/` |
| Codex | repo acts as its own marketplace (`.agents/plugins/marketplace.json`) |
| CI | `uses: aidevme/A11Y-skills/action@main` ([action/](action/)), or the Azure DevOps template ([.azdo/](.azdo/)) |

## What the audit checks

- **Layer 1 (static)** — `rules-react`: 21 rules wrapping `eslint-plugin-jsx-a11y` with WCAG metadata. `rules-fluent-ui`: 6 custom rules for Fluent UI v9 semantics (import-resolved, alias-aware). Full generated list: [docs/rule-reference.md](docs/rule-reference.md).
- **Layer 2 (runtime, `--runtime`)** — axe-core via Playwright across a mobile/tablet/desktop viewport matrix, plus dedicated checks for reflow at 320px (SC 1.4.10), WCAG text-spacing overrides (SC 1.4.12), and single-orientation lockout (SC 1.3.4).

Findings carry WCAG references, drift-resilient fingerprints, and a non-interference flag for the four WCAG 5.2.5 criteria (never relaxed, never baseline-eligible).

## Reports

| Format | Use |
| --- | --- |
| `md` (default) | Chat/CLI, grouped by severity → WCAG SC |
| `json` | Raw findings for downstream tooling; add `--claim` for a WCAG 5.3.2 conformance-claim block |
| `sarif` | GitHub Advanced Security code scanning / PR annotations |
| `html` | Self-contained, filterable/sortable client deliverable — itself passes an axe scan; supports `--compare previous.html` for trend and per-process pass/fail (WCAG 5.2.3) when `processes` is configured |

## CI/CD

- **GitHub Action** — [action/action.yml](action/action.yml): runs the audit, uploads SARIF to code scanning, publishes the report as an artifact. See [action/README.md](action/README.md).
- **Azure DevOps** — [.azdo/azure-pipelines.yml](.azdo/azure-pipelines.yml): same CLI, parameterized `path`/`failOn`/`reportFormat`/`runtime`.

## Development

```bash
npm install
npx playwright install chromium   # once, for the runtime-axe layer/tests
npm run build      # tsc -b, all workspaces
npm test           # vitest (builds first)
npm run lint
npm run docs:rules            # regenerate docs/rule-reference.md
npm run validate:skills       # Agent Skills spec check
npm run validate:manifests    # marketplace manifest consistency
```

Design: [docs/DESIGN.md](docs/DESIGN.md) · Plan: [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) · Tests: [docs/TEST_PLAN.md](docs/TEST_PLAN.md) · Safety: [docs/safety-and-guardrails.md](docs/safety-and-guardrails.md)

License: MIT
