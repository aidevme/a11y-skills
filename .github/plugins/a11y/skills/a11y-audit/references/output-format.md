# Audit JSON output format

`a11y audit --format json` prints an array of Finding objects, deduped and sorted (severity → WCAG SC → file → line).

| Field | Meaning |
| --- | --- |
| `ruleId` | Stable rule id, prefixed by pack (`react-*`, `fluent-*`) |
| `severity` | Effective severity: `error` \| `warning` \| `info` |
| `baseSeverity` | The rule's own severity before profile mapping |
| `wcagRef` / `wcagLevel` / `wcagVersion` | WCAG success criterion, its conformance level, and the WCAG version it first appeared in |
| `nonInterference` | `true` for SC 1.4.2, 2.1.2, 2.2.2, 2.3.1 — never relaxed, never baselined |
| `message` | Human-readable description from the underlying rule |
| `file` | Path relative to the audited root (posix separators) |
| `range` | `{ startLine, startCol, endLine?, endCol? }`, 1-based |
| `layer` | 1 = static, 2 = runtime (v1+), 3 = domain rules (v2+) |
| `surface` | `web-app`, `pcf` (`packages/rules-pcf`), or `code-apps` (`packages/rules-code-apps`); `power-pages` is detected but has no rule pack until a later version |
| `framework` | e.g. `react` |
| `fingerprint` | Line-drift-resilient identity (rule + file + context hash) — used by baselines |
| `context` | Trimmed source line the finding refers to |

Exit codes: 0 = clean/below threshold, 1 = findings at/above `--fail-on`, 2 = execution error (report stderr, don't interpret as clean).
