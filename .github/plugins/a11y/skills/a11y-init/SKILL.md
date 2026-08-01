---
name: a11y-init
description: Sets up accessibility governance in a project. Generates a project-tailored A11Y.md context file, writes a default .a11yrc.json with a compliance profile, and wires pointer snippets into every detected host config (CLAUDE.md, .cursorrules, copilot-instructions.md, AGENTS.md). Trigger on "/a11y-init", "set up accessibility", "add accessibility guidelines", "initialize a11y".
allowed-tools: Read Bash Glob
---

# a11y-init

Wire Layer 0 (prevention) into the current project. All logic lives in the CLI — this skill runs it and explains the result.

## Flow

1. Run:

   ```bash
   npx --yes @aidevme/a11y init <path>
   ```

   (`scripts/run-init.sh` wraps this.)

2. The CLI detects the framework (React, Fluent) and the agent hosts present, then:
   - creates `A11Y.md` with a generated block tailored to the detected stack (or refreshes only the marked block, preserving user content);
   - creates `.a11yrc.json` if absent — **never overwrites** an existing one;
   - appends a one-line pointer to each existing host file (`CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `.github/copilot-instructions.md`), idempotently.

3. Report what was created / updated / unchanged, and explain the profile default (`standard` = WCAG 2.2 AA; see `references/profiles.md` for `strict` and `mvp`).

4. Re-running is always safe — tell the user that regenerating after adding rule packs keeps A11Y.md in sync with the audit rules (single source of truth).

## Notes

- If no host files exist, only `A11Y.md` + `.a11yrc.json` are created; suggest which host file the user's setup would benefit from, but do not invent files unasked.
- `--with-hooks` (Claude Code enforcement) and `--with-precommit` ship in later versions — if asked, say they are not yet available in this version.
