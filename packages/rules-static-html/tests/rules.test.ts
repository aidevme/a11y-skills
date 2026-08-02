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

describe('rules-static-html', () => {
  it('TC-P3.1-01..08: seeded fixture yields exactly the expected findings across all 6 check families', async () => {
    const expected = JSON.parse(
      readFileSync(join(fixture('static-html-seeded'), 'expected-findings.json'), 'utf8'),
    ) as Expected[];
    expect(await auditFixture('static-html-seeded')).toEqual(expected.sort(byRuleThenLine));
  });

  it('TC-P3.1-08: clean fixture yields zero findings (false-positive gate)', async () => {
    expect(await auditFixture('static-html-clean')).toEqual([]);
  });

  it('AC-P3-1: no rule and no finding maps to SC 4.1.1', async () => {
    for (const meta of Object.values(loadRuleMap())) {
      expect(meta.wcagRef).not.toBe('4.1.1');
    }
    const findings = await runRules(
      listUiFiles(fixture('static-html-seeded'), ['.html']),
      fixture('static-html-seeded'),
    );
    expect(findings.every((f) => f.wcagRef !== '4.1.1')).toBe(true);
  });

  it('output is deterministic across runs', async () => {
    const a = await auditFixture('static-html-seeded');
    const b = await auditFixture('static-html-seeded');
    expect(a).toEqual(b);
  });

  it('AC-P3-1: mapping table covers all 6 check families with complete WCAG metadata', () => {
    const map = loadRuleMap();
    expect(Object.keys(map).sort()).toEqual(
      ['heading-order', 'img-alt', 'label-pairing', 'landmark-main', 'lang-invalid', 'lang-missing', 'skip-link'].sort(),
    );
    for (const [key, meta] of Object.entries(map)) {
      expect(meta.ruleId, key).toMatch(/^html-/);
      expect(['error', 'warning', 'info']).toContain(meta.severity);
      expect(meta.wcagRef).toMatch(/^\d+\.\d+\.\d+$/);
      expect(['A', 'AA', 'AAA']).toContain(meta.wcagLevel);
    }
  });
});
