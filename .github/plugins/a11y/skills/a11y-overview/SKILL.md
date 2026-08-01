---
name: a11y-overview
description: Cross-cutting accessibility rules and request routing for the a11y plugin. Loaded first; routes audit requests to a11y-audit, setup to a11y-init, remediation to a11y-fix, and topic questions to the matching reference guide. Use when a request mentions accessibility, a11y, WCAG, or ARIA and no more specific a11y skill applies.
---

# a11y-overview

Router + cross-cutting conventions for all a11y-* skills.

## Cross-cutting rules (apply in every a11y skill)

- Always cite the WCAG success criterion by number and name (e.g. "SC 4.1.2 Name, Role, Value") when discussing a finding or giving guidance.
- Respect the compliance profile in `.a11yrc.json` (`strict` / `standard` / `mvp`) and `wcagVersion` when describing severity — they are the user's compliance contract.
- Never describe a violation of SC 1.4.2, 2.1.2, 2.2.2, or 2.3.1 as low priority — these are non-interference criteria; they can make an entire page unusable and are never relaxed.
- Severity language: "error" = fails the target conformance level; "warning" = should fix, does not gate; never say "critical/minor" — use the severity the tooling reports.
- Prefer showing a minimal diff over describing a fix in prose.

## Routing

| Request shape | Route to |
| --- | --- |
| "audit / check accessibility / WCAG compliance / scan for a11y issues" | `a11y-audit` |
| "set up accessibility / initialize / add A11Y.md / accessibility guidelines" | `a11y-init` |
| "fix these findings / remediate the audit results" | `a11y-fix` |
| Forms, labels, validation, autocomplete questions | `a11y-forms` |
| Dialogs, modals, drawers, popovers, focus trapping | `a11y-dialogs` |
| Keyboard navigation, tab order, focus management, skip links | `a11y-keyboard` |
| PCF controls, Dataverse forms, model-driven apps | `a11y-pcf` (states its current limits) |
| Power Pages, Liquid templates, portals | `a11y-pages` (states its current limits) |

When a request spans several topics (e.g. "audit this dialog"), run `a11y-audit` first, then pull the topic guide for remediation depth.
