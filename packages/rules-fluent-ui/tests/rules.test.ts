import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { listUiFiles } from '../../core/src/files.js';
import { loadRuleMap, runRules } from '../src/index.js';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const fixture = (name: string): string => join(repoRoot, 'examples', name);

interface Expected {
  ruleId: string;
  file: string;
  line: number;
  severity: string;
  wcagRef: string;
}

const byRuleThenLine = (a: Expected, b: Expected): number =>
  a.ruleId.localeCompare(b.ruleId) || a.line - b.line;

async function auditFixture(name: string): Promise<Expected[]> {
  const root = fixture(name);
  const findings = await runRules(listUiFiles(root), root);
  return findings
    .map((f) => ({
      ruleId: f.ruleId,
      file: f.file,
      line: f.range?.startLine ?? 0,
      severity: f.severity,
      wcagRef: f.wcagRef,
    }))
    .sort(byRuleThenLine);
}

describe('rules-fluent-ui', () => {
  it('TC-P1.4-01..05: seeded fixture yields exactly the expected findings', async () => {
    const expected = JSON.parse(
      readFileSync(join(fixture('fluent-seeded'), 'expected-findings.json'), 'utf8'),
    ) as Expected[];
    expect(await auditFixture('fluent-seeded')).toEqual(expected.sort(byRuleThenLine));
  });

  it('TC-P1.4-06: local component named Button does not trigger fluent rules', async () => {
    // The seeded fixture renders a local <Button icon="plus" /> on line 27;
    // the exact-findings assertion above already excludes it — this pins the
    // intent explicitly.
    const findings = await auditFixture('fluent-seeded');
    expect(findings.some((f) => f.line === 27)).toBe(false);
  });

  it('TC-P1.4-07: aliased Fluent import (Button as Btn) still fires', async () => {
    const findings = await auditFixture('fluent-seeded');
    expect(
      findings.some((f) => f.ruleId === 'fluent-button-accessible-name' && f.line === 20),
    ).toBe(true);
  });

  it('TC-P1.4-09: clean fixture yields zero findings', async () => {
    expect(await auditFixture('fluent-clean')).toEqual([]);
  });

  it('AC-P1-3: no rule maps to SC 4.1.1', () => {
    for (const meta of Object.values(loadRuleMap())) {
      expect(meta.wcagRef).not.toBe('4.1.1');
    }
  });

  it('mapping table entries carry complete WCAG metadata', () => {
    for (const [key, meta] of Object.entries(loadRuleMap())) {
      expect(meta.ruleId, key).toMatch(/^fluent-/);
      expect(['error', 'warning', 'info']).toContain(meta.severity);
      expect(meta.wcagRef).toMatch(/^\d+\.\d+\.\d+$/);
      expect(['A', 'AA', 'AAA']).toContain(meta.wcagLevel);
    }
  });
});
