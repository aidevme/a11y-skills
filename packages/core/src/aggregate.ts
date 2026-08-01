import type { Finding, Severity } from './finding.js';

const SEVERITY_RANK: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

/**
 * Merge findings from all layers: dedupe by fingerprint (first occurrence
 * wins), then sort by severity → wcagRef → file → line.
 * Profile severity mapping and baseline filtering are later pipeline stages
 * (P2); the identity behavior here keeps the stage boundaries in place.
 */
export function aggregate(findings: Finding[]): Finding[] {
  const seen = new Map<string, Finding>();
  for (const f of findings) {
    if (!seen.has(f.fingerprint)) seen.set(f.fingerprint, f);
  }
  return [...seen.values()].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      a.wcagRef.localeCompare(b.wcagRef, undefined, { numeric: true }) ||
      a.file.localeCompare(b.file) ||
      (a.range?.startLine ?? 0) - (b.range?.startLine ?? 0),
  );
}
