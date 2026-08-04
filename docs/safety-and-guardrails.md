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

## What the hooks may block (opt-in, v1.6)

The plugin ships two Claude Code hooks at `.github/plugins/a11y/hooks/hooks.json` (`UserPromptSubmit`, `PreToolUse`). Installing the plugin registers both unconditionally — Claude Code has no native per-project toggle for plugin hooks — but **both scripts self-check `.a11yrc.json`'s `hooksEnabled` field first and exit as a silent no-op (`{}`, allow) whenever it is absent or not exactly `true`.** That field defaults to `false` and is the only thing that turns the hooks on. Set it by running:

```sh
npx @aidevme/a11y init --with-hooks
```

which merge-patches `hooksEnabled: true` into `.a11yrc.json` (creating the file with sane defaults if it doesn't exist yet) without touching any other field you've set.

- **UserPromptSubmit** classifies the prompt text against a keyword table (dialog/modal, form/label/validation, keyboard/tabindex/focus-order, plus a broader UI/component/ARIA/WCAG signal) mirroring the `a11y-overview` skill's routing table. When it matches, it injects a short accessibility reminder and the relevant topic-guide name as additional context. **It never blocks anything and always exits 0**, even on malformed input.
- **PreToolUse** (matcher `Write|Edit`) acts on files with a lintable UI extension (`.tsx`, `.jsx`, `.vue`, `.svelte`, `.html`) as well as `ControlManifest.Input.xml` (PCF manifests) and `.form.xml` (Dataverse form customizations, Phase 5+). It reconstructs the file's content *as it would read after the pending write* — the literal `content` for `Write`, or the current on-disk content with `old_string`→`new_string` applied for `Edit` — writes that to a throwaway temp file next to the real one (keeping the distinguishing filename tail, e.g. still ending in `ControlManifest.Input.xml`, so the right rule pack matches it), and runs `npx --yes @aidevme/a11y audit --files <temp>` against it. If any `error`-severity finding comes back, it denies the write with `permissionDecision: "deny"` and lists every violation (rule id, line, message, WCAG SC) in the reason so the agent can fix and retry. The temp file is always deleted afterward, whether the check passes, fails, or errors.
- **PCF/Dataverse caveat:** the Layer 3 PCF/Dataverse rules only fire when the project already has a real `ControlManifest.Input.xml` on disk somewhere — surface detection has no way to see a file that only exists as pending, not-yet-written content. Editing an existing PCF control's manifest is fully covered; a control's very first manifest, created from nothing in a single `Write`, is not checked on that first write (real PCF scaffolds normally come from `pac pcf init`, not an agent-authored `Write`, so this is a narrow gap). `.liquid` (Power Pages) has no rule pack at all yet (Phase 7) — writes to `.liquid` files are classified but always **allowed**.
- **Fails open, always.** If the check itself can't complete — `npx` isn't on `PATH`, the package fetch fails, the 15-second timeout is hit, the CLI's own JSON output doesn't parse, or an `Edit`'s `old_string` can't be found in the current file — the hook allows the write rather than blocking it. A malfunctioning gate must never be able to stop you from working; missing an occasional finding is the acceptable failure mode, not a stuck session.
- **Performance is honest, not padded.** The design target is "low single-digit seconds," which holds once `npx`'s local cache is warm. The very first invocation in a fresh environment can cost more (package resolution before anything is cached), so the hook's own timeout is set to 15s to avoid false hard-failures on that first run rather than to represent the typical case.
- Only ever reads the single file being written and `.a11yrc.json`; only ever writes the one throwaway temp file it creates and removes; makes no network calls beyond what `npx` needs to resolve `@aidevme/a11y` from your configured registry.

**To disable:** installing the plugin does not, by itself, do anything — leave `hooksEnabled` unset (or `false`) and both hooks stay inert. Once enabled, turn it back off by setting `"hooksEnabled": false` in `.a11yrc.json` (`a11y init` never sets this key back to `false` for you — like the git pre-commit gate, opting out is a deliberate, direct edit, not an automatic side effect of a flag you stop passing). Uninstalling or disabling the plugin in Claude Code removes both hooks entirely, regardless of the config.

## Scope guarantees

- No files outside the invoked project directory are read or written.
- No credentials are read, stored, or required for the static layers. The runtime layer uses only the URL (and any auth you bake into your own dev-server setup).
- Exit codes are the only signal CI consumes; nothing is persisted between runs except the files listed above.
