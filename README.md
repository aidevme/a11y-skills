# a11y-skills

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Accessibility auditing as a multi-agent plugin + skillset: WCAG 2.2 static + runtime analysis for React and Fluent UI v9 today; Vue/Angular/Svelte/static HTML and Power Platform surfaces (PCF, Code Apps, Power Pages) on the [roadmap](docs/IMPLEMENTATION.md).

## Prerequisites

- Node.js ≥ 20 to run the `@aidevme/a11y` CLI directly (`npx @aidevme/a11y ...`). Not required just to install the agent plugin — the host manages that.
- One of: Claude Code, GitHub Copilot CLI, Codex, or Cursor. For CI-only use, see [CI/CD](#cicd) below — no agent host needed.

## Install

The canonical plugin source is `.github/plugins/a11y/` — skills: `a11y-overview` (router), `a11y-audit`, `a11y-init`, `a11y-fix`, plus topic guides (`a11y-forms`, `a11y-dialogs`, `a11y-keyboard`, `a11y-pcf`, `a11y-pages`).

> Not yet submitted to the official Claude Code or awesome-copilot marketplace listings (tracked in [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) §2.8) — until then, install straight from this repo, as below. The work in this README currently lives on the `dev` branch (`main` only has a placeholder commit), so every command below pins `dev` explicitly — drop the ref once `dev` merges into `main`.

### GitHub Copilot CLI

Copilot CLI natively reads `.github/plugin/marketplace.json`, so no extra config is needed on our side. Marketplace refs use `#ref`:

```bash
copilot plugin marketplace add aidevme/a11y-skills#dev
copilot plugin install a11y@a11y-skills
```

(or the in-session slash-command equivalents: `/plugin marketplace add aidevme/a11y-skills#dev` then `/plugin install a11y@a11y-skills`.)

### Claude Code

Marketplace refs use `@ref`:

```bash
/plugin marketplace add aidevme/a11y-skills@dev
/plugin install a11y@a11y-skills
```

### Codex

**Codex CLI** — marketplace refs use `@ref`:

```bash
codex plugin marketplace add aidevme/a11y-skills@dev
```

Then browse `/plugins` and install `a11y`. Update later with:

```bash
codex plugin marketplace upgrade a11y-skills
```

**Codex app**

1. Open **Plugins → Add marketplace**.
2. Set **Source** to `https://github.com/aidevme/a11y-skills.git`.
3. Set **Git ref** to `dev`. Leave **Sparse paths** empty.
4. Click **Add marketplace**, then browse the **a11y-skills** marketplace, open `a11y`, and select **Install plugin**.

### Cursor

No marketplace listing yet — copy the plugin source manually:

```bash
git clone --branch dev https://github.com/aidevme/a11y-skills.git
cp -r a11y-skills/.github/plugins/a11y ~/.cursor/plugins/local/a11y
```

## Verify the install

Paste this into the agent session after installing — it only inspects the install, it does not run an audit or touch any files:

```text
Verify that the a11y plugin installed correctly:

1. List installed plugins (Claude Code: `/plugin list`; Copilot CLI:
   `copilot plugin list`; Codex: `codex plugin list`) and confirm "a11y"
   appears, enabled, sourced from marketplace "a11y-skills".
2. List available skills (Claude Code: `/skills`) and confirm nine skills
   exist under the a11y namespace: a11y-overview, a11y-audit, a11y-init,
   a11y-fix, a11y-forms, a11y-dialogs, a11y-keyboard, a11y-pcf, a11y-pages.
   (If your host has no skill-listing command, skip to step 3 instead.)
3. Confirm a11y-overview is acting as a router by asking it: "check
   accessibility of this component" — it should route to a11y-audit rather
   than answering directly.
4. Do NOT run an actual audit or modify any files — this is an install
   check only.

Report back: plugin present + version, skill count and names (or "not
listable, used routing test instead"), and whether the routing test worked.
```

## Try these prompts

Once installed, describe what you want — `a11y-overview` routes to the right specialist skill:

- *"Check accessibility of this component"*
- *"Set up accessibility guidelines for this repo"*
- *"How do I make this modal accessible?"*
- *"Fix these accessibility findings"*
- *"What ARIA attributes does this dropdown need?"*
- *"What's involved in making this Power Pages form accessible?"*

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

- **GitHub Action** — `uses: aidevme/a11y-skills/action@dev` ([action/action.yml](action/action.yml)): runs the audit, uploads SARIF to code scanning, publishes the report as an artifact. See [action/README.md](action/README.md).
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
