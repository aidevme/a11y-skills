# Safety and Guardrails

This document describes what the a11y-skills plugin and CLI can and cannot do on your machine, following the convention of the Dataverse-skills repository ([DESIGN.md](DESIGN.md) §3).

## What the CLI reads

The `@aidevme/a11y` CLI reads only:

- Source files in the project directory it is invoked on (to run static accessibility rules).
- Project configuration: `.a11yrc.json`, `package.json`, framework/surface marker files (`ControlManifest.Input.xml`, `power.config.json`, Liquid templates, and similar).
- When the runtime layer is explicitly enabled (`--runtime`), the URL you point it at — a local dev server, a Storybook build, or a Power Pages site.

## What the CLI transmits

**Nothing.** The CLI makes no network calls of its own, sends no telemetry, and uploads nothing. Reports (SARIF, Markdown, JSON, HTML) are written to the local filesystem only; publishing them (for example, uploading SARIF to GitHub code scanning) is done by your CI configuration, not by the tool.

The only network activity the toolkit can cause is the runtime layer fetching the URL you explicitly configured for scanning.

## What the CLI writes

- Report files at the paths you specify.
- `a11y init` writes `A11Y.md`, `.a11yrc.json` (if absent), and pointer snippets in host context files (`CLAUDE.md`, `.cursorrules`, `copilot-instructions.md`, `AGENTS.md`) — idempotently, and only in the project root it is run in.
- `a11y baseline` writes `.a11y-baseline.json`.

## What the hooks may block (opt-in, ships in v1.6)

The optional Claude Code hooks are **disabled unless you install them** via `a11y-init --with-hooks`:

- **UserPromptSubmit** injects accessibility guidance into UI-related prompts. It never blocks anything.
- **PreToolUse** can deny an Edit/Write to UI file types (`.tsx`, `.jsx`, `.vue`, `.svelte`, `.html`, Liquid templates, `ControlManifest.Input.xml`) when the fast static lint of the pending change reports violations. The denial reason lists the violations so the agent can correct and retry. It checks only the pending change, never the whole repository.

To disable enforcement at any time, remove the hooks from your Claude Code settings or rerun `a11y init` without `--with-hooks`.

## Scope guarantees

- No files outside the invoked project directory are read or written.
- No credentials are read, stored, or required for the static layers. The runtime layer uses only the URL (and any auth you bake into your own dev-server setup).
- Exit codes are the only signal CI consumes; nothing is persisted between runs except the files listed above.
