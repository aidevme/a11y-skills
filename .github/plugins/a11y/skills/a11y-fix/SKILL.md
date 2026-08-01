---
name: a11y-fix
description: Takes accessibility audit findings and proposes or applies minimal remediation diffs, one finding at a time, using per-rule fix patterns. Trigger on "/a11y-fix", "fix these accessibility findings", "remediate a11y issues", "apply accessibility fixes".
allowed-tools: Read Edit Bash Glob Grep
---

# a11y-fix

Turn audit findings into applied diffs, one finding at a time — never a bulk unreviewed rewrite.

## Flow

1. Get findings: run `scripts/run-audit.sh <path>` (or reuse JSON already produced by `a11y-audit` in this session).
2. For each finding (default: process in the order returned — errors first, then warnings), look up its ruleId in `references/fix-patterns.md`. If no pattern is documented, say so explicitly — do not invent a fix.
3. Read the finding's `file` at `range.startLine` for context, then propose the **smallest diff that resolves the finding** without changing unrelated code or introducing new violations (e.g. don't strip a `<label>` to "fix" spacing).
4. Apply only after user approval, unless the user has asked for autonomous fixing of a specific batch.
5. After applying, re-run the audit scoped to that file and confirm the specific finding is gone and no new finding appeared at the same location. Report both facts.
6. If a fix requires a judgment call the user should make (e.g. what alt text describes an image, what a Dialog's title should say), ask rather than guessing content.

## Rules of engagement

- One finding, one diff, one review point — resist batching unrelated fixes into a single edit.
- Never suppress a finding via `.a11yrc.json` overrides or eslint-disable comments as a "fix" unless the user explicitly asks for a suppression.
- Non-interference findings (`nonInterference: true`) are never optional — always fix, never suggest deferring them.
