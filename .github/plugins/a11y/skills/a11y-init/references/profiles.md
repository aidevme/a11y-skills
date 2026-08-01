# Compliance profiles

Set via `profile` in `.a11yrc.json`; one switch drives A11Y.md content and (from v1) audit severities.

| Profile | Target | Behavior |
| --- | --- | --- |
| `strict` | WCAG AAA | All rules error. Note: W3C advises against requiring AAA site-wide — use for components/pages, not blanket policy. |
| `standard` (default) | WCAG AA | A/AA rules error, AAA rules warn. |
| `mvp` | WCAG A | Visual/contrast rules relax to warnings; **semantic structure rules never relax**. |

`wcagVersion` (`2.0` / `2.1` / `2.2`, default `2.2`) pins the rule set to a contractual scope — e.g. EN 301 549 engagements pin `2.1`.

**Non-interference floor (all profiles):** rules for SC 1.4.2 (audio control), 2.1.2 (keyboard trap), 2.2.2 (pause/stop/hide), 2.3.1 (three flashes) are never relaxed and never baseline-eligible.
