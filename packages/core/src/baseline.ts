import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Finding } from './finding.js';

export const BASELINE_FILE = '.a11y-baseline.json';

export interface BaselineEntry {
  fingerprint: string;
  ruleId: string;
  file: string;
}

export function loadBaselineEntries(projectRoot: string): BaselineEntry[] | null {
  const path = join(projectRoot, BASELINE_FILE);
  if (!existsSync(path)) return null;
  const data = JSON.parse(readFileSync(path, 'utf8')) as { findings?: BaselineEntry[] };
  return data.findings ?? [];
}

export function writeBaselineEntries(projectRoot: string, entries: BaselineEntry[]): void {
  writeFileSync(
    join(projectRoot, BASELINE_FILE),
    `${JSON.stringify({ findings: entries }, null, 2)}\n`,
    'utf8',
  );
}

/**
 * Snapshot mode: baseline all current findings EXCEPT non-interference ones
 * (DESIGN §12.1 — those fail immediately even in brownfield mode).
 */
export function snapshotBaseline(findings: Finding[]): {
  entries: BaselineEntry[];
  refusedNonInterference: number;
} {
  const eligible = findings.filter((f) => !f.nonInterference);
  return {
    entries: eligible.map((f) => ({ fingerprint: f.fingerprint, ruleId: f.ruleId, file: f.file })),
    refusedNonInterference: findings.length - eligible.length,
  };
}

/** Prune mode: keep only entries still found — the baseline only ever shrinks. */
export function pruneBaseline(
  existing: BaselineEntry[],
  findings: Finding[],
): { entries: BaselineEntry[]; pruned: number } {
  const current = new Set(findings.map((f) => f.fingerprint));
  const entries = existing.filter((e) => current.has(e.fingerprint));
  return { entries, pruned: existing.length - entries.length };
}

/** Marks findings present in the baseline (non-interference is never maskable). */
export function applyBaseline(findings: Finding[], entries: BaselineEntry[] | null): Finding[] {
  if (!entries || entries.length === 0) return findings;
  const set = new Set(entries.map((e) => e.fingerprint));
  return findings.map((f) =>
    set.has(f.fingerprint) && !f.nonInterference ? { ...f, baselined: true } : f,
  );
}
