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
  const findings = await runRules(listUiFiles(root, ['.html']), root);
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

describe('rules-angular', () => {
  it('TC-P4.1: seeded fixture yields exactly the expected findings', async () => {
    const expected = JSON.parse(
      readFileSync(join(fixture('angular-seeded'), 'expected-findings.json'), 'utf8'),
    ) as Expected[];
    expect(await auditFixture('angular-seeded')).toEqual(expected.sort(byRuleThenLine));
  });

  it('*.component.html scoping: app shell (index.html) is never linted, even with a real violation', async () => {
    const findings = await auditFixture('angular-seeded');
    expect(findings.every((f) => f.file !== 'src/index.html')).toBe(true);
  });

  it('TC-P4.1: clean fixture yields zero findings (false-positive gate)', async () => {
    expect(await auditFixture('angular-clean')).toEqual([]);
  });

  it('AC-P4-1: no rule and no finding maps to SC 4.1.1', async () => {
    for (const meta of Object.values(loadRuleMap())) {
      expect(meta.wcagRef).not.toBe('4.1.1');
    }
    const findings = await runRules(
      listUiFiles(fixture('angular-seeded'), ['.html']),
      fixture('angular-seeded'),
    );
    expect(findings.every((f) => f.wcagRef !== '4.1.1')).toBe(true);
  });

  it('output is deterministic across runs', async () => {
    const a = await auditFixture('angular-seeded');
    const b = await auditFixture('angular-seeded');
    expect(a).toEqual(b);
  });

  it('mapping table entries carry complete WCAG metadata', () => {
    for (const [key, meta] of Object.entries(loadRuleMap())) {
      expect(meta.ruleId, key).toMatch(/^angular-/);
      expect(['error', 'warning', 'info']).toContain(meta.severity);
      expect(meta.wcagRef).toMatch(/^\d+\.\d+\.\d+$/);
      expect(['A', 'AA', 'AAA']).toContain(meta.wcagLevel);
    }
  });
});
