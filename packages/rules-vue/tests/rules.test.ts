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
  const findings = await runRules(listUiFiles(root, ['.vue']), root);
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

describe('rules-vue', () => {
  it('TC-P3.2: seeded fixture yields exactly the expected findings', async () => {
    const expected = JSON.parse(
      readFileSync(join(fixture('vue-seeded'), 'expected-findings.json'), 'utf8'),
    ) as Expected[];
    expect(await auditFixture('vue-seeded')).toEqual(expected.sort(byRuleThenLine));
  });

  it('TC-P3.2: clean fixture yields zero findings (false-positive gate)', async () => {
    expect(await auditFixture('vue-clean')).toEqual([]);
  });

  it('AC-P3-2: no rule and no finding maps to SC 4.1.1', async () => {
    for (const meta of Object.values(loadRuleMap())) {
      expect(meta.wcagRef).not.toBe('4.1.1');
    }
    const findings = await runRules(
      listUiFiles(fixture('vue-seeded'), ['.vue']),
      fixture('vue-seeded'),
    );
    expect(findings.every((f) => f.wcagRef !== '4.1.1')).toBe(true);
  });

  it('output is deterministic across runs', async () => {
    const a = await auditFixture('vue-seeded');
    const b = await auditFixture('vue-seeded');
    expect(a).toEqual(b);
  });

  it('mapping table entries carry complete WCAG metadata', () => {
    for (const [key, meta] of Object.entries(loadRuleMap())) {
      expect(meta.ruleId, key).toMatch(/^vue-/);
      expect(['error', 'warning', 'info']).toContain(meta.severity);
      expect(meta.wcagRef).toMatch(/^\d+\.\d+\.\d+$/);
      expect(['A', 'AA', 'AAA']).toContain(meta.wcagLevel);
      expect(['2.0', '2.1', '2.2']).toContain(meta.wcagVersion);
      expect(meta.category.length).toBeGreaterThan(0);
      expect(meta.summary.length).toBeGreaterThan(0);
    }
  });
});
