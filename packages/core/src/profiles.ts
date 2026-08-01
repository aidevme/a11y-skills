import type { A11yConfig } from './config.js';
import type { Finding, Severity } from './finding.js';

const VERSION_ORDER: Record<'2.0' | '2.1' | '2.2', number> = { '2.0': 0, '2.1': 1, '2.2': 2 };
const RANK: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

/** Relax a severity downward to at most `cap` (never raises). */
function capAt(severity: Severity, cap: Severity): Severity {
  return RANK[severity] < RANK[cap] ? cap : severity;
}

/**
 * Profile severity mapping (DESIGN §2.3b):
 * - Rules first introduced after the configured wcagVersion are excluded.
 * - Non-interference findings are always errors, ignore overrides, and are
 *   never excluded by a profile.
 * - strict: everything errors. standard: AAA capped to warning. mvp: AAA and
 *   visual-category rules capped to warning; semantic rules never relax.
 * - Per-rule overrides apply last (non-NI only); "off" removes the finding.
 */
export function applyProfile(findings: Finding[], config: A11yConfig): Finding[] {
  const out: Finding[] = [];
  for (const f of findings) {
    if (VERSION_ORDER[f.wcagVersion] > VERSION_ORDER[config.wcagVersion]) continue;
    if (f.nonInterference) {
      out.push({ ...f, severity: 'error' });
      continue;
    }
    let severity: Severity = f.baseSeverity;
    if (config.profile === 'strict') {
      severity = 'error';
    } else if (config.profile === 'standard') {
      if (f.wcagLevel === 'AAA') severity = capAt(severity, 'warning');
    } else {
      if (f.wcagLevel === 'AAA') severity = capAt(severity, 'warning');
      if (f.category === 'visual') severity = capAt(severity, 'warning');
    }
    const override = config.overrides[f.ruleId];
    if (override === 'off') continue;
    if (override) severity = override;
    out.push({ ...f, severity });
  }
  return out;
}
