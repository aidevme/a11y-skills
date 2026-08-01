---
name: a11y-audit
description: Audits React, Fluent UI v9, and (in later versions) Vue, Angular, Svelte, static HTML, PCF, Power Apps Code Apps and Power Pages for WCAG 2.2 compliance. Runs static rules via the @aidevme/a11y CLI and summarizes findings with proposed fixes. Trigger on "/a11y-audit", "check accessibility", "audit ARIA", "WCAG compliance".
allowed-tools: Read Bash Glob Grep
---

# a11y-audit

Audit the current project (or a path the user names) and turn findings into actionable fixes — never dump a raw report.

## Flow

1. Run the audit with JSON output:

   ```bash
   npx --yes @aidevme/a11y audit <path> --format json --fail-on never
   ```

   (`scripts/run-audit.sh` wraps this.) Exit 2 means an execution problem — report the stderr message and stop; do not treat it as "no findings".

2. Parse the JSON (see `references/output-format.md` for the schema). Group by `severity`, then `wcagRef`.

3. Report to the user:
   - Totals per severity and the pass/fail verdict against their `--fail-on` intent.
   - Findings that have `nonInterference: true` first, flagged as never-relaxable (keyboard traps, flashing, autoplaying audio, unstoppable motion).
   - For each finding cite the WCAG success criterion (e.g. "SC 4.1.2 Name, Role, Value") — always.

4. For the top issues (up to ~5), Read the file at the finding's `range` and propose a **concrete minimal diff**. Typical fixes per rule family are in `references/rule-packs.md`. Apply diffs only with user approval.

5. If the project has no detectable framework, say so: only generic checks ran, and name what the installed version supports (React + Fluent UI v9).

## Rules of engagement

- Never invent findings the CLI did not report; never suppress ones it did.
- Determinism matters: re-running on unchanged code yields identical output — if the user doubts a result, re-run rather than reinterpret.
- Respect `.a11yrc.json` (profile, wcagVersion) — it is the user's compliance contract.
