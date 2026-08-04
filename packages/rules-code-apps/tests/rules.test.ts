import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { listUiFiles } from '../../core/src/files.js';
import { loadRuleMap, runRules } from '../src/index.js';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const fixture = (name: string): string => join(repoRoot, 'examples', name);
const EXTENSIONS = ['.tsx'];

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
  const findings = await runRules(listUiFiles(root, EXTENSIONS), root);
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

describe('rules-code-apps', () => {
  it('TC-P6.1-01..03: seeded fixture yields exactly the expected findings', async () => {
    const expected = JSON.parse(
      readFileSync(join(fixture('code-apps-seeded'), 'expected-findings.json'), 'utf8'),
    ) as Expected[];
    expect(await auditFixture('code-apps-seeded')).toEqual(expected.sort(byRuleThenLine));
  });

  it('TC-P6.1-04: compliant generated screen yields zero findings (false-positive gate)', async () => {
    expect(await auditFixture('code-apps-clean')).toEqual([]);
  });

  it('TC-P6.1-01: a clickable column header without aria-sort fires at warning/4.1.2', async () => {
    const findings = await auditFixture('code-apps-seeded');
    const finding = findings.find((f) => f.ruleId === 'code-apps-grid-header-missing-sort-state');
    expect(finding).toMatchObject({ severity: 'warning', wcagRef: '4.1.2' });
  });

  it('a column header without a sort handler never fires (no click handler = not a sortable header)', async () => {
    const findings = await auditFixture('code-apps-seeded');
    expect(findings.filter((f) => f.ruleId === 'code-apps-grid-header-missing-sort-state')).toHaveLength(1);
  });

  it('TC-P6.1-02: an unlabeled numeric pagination button fires at error/4.1.2; a labeled one does not', async () => {
    const findings = await auditFixture('code-apps-seeded');
    const pagination = findings.filter((f) => f.ruleId === 'code-apps-pagination-button-missing-label');
    expect(pagination).toHaveLength(1);
    expect(pagination[0]).toMatchObject({ severity: 'error', wcagRef: '4.1.2' });
  });

  it('TC-P6.1-03: a data-bound screen (.map) with no live region fires at warning/4.1.3', async () => {
    const findings = await auditFixture('code-apps-seeded');
    const finding = findings.find((f) => f.ruleId === 'code-apps-datagrid-missing-live-region');
    expect(finding).toMatchObject({ severity: 'warning', wcagRef: '4.1.3' });
  });

  it('AC-P6-1: no rule and no finding maps to SC 4.1.1', async () => {
    for (const meta of Object.values(loadRuleMap())) {
      expect(meta.wcagRef).not.toBe('4.1.1');
    }
    const findings = await runRules(listUiFiles(fixture('code-apps-seeded'), EXTENSIONS), fixture('code-apps-seeded'));
    expect(findings.every((f) => f.wcagRef !== '4.1.1')).toBe(true);
  });

  it('every finding carries layer 3 (domain rule engine)', async () => {
    const findings = await runRules(listUiFiles(fixture('code-apps-seeded'), EXTENSIONS), fixture('code-apps-seeded'));
    expect(findings.every((f) => f.layer === 3)).toBe(true);
  });

  it('output is deterministic across runs', async () => {
    const a = await auditFixture('code-apps-seeded');
    const b = await auditFixture('code-apps-seeded');
    expect(a).toEqual(b);
  });

  it('mapping table entries carry complete WCAG metadata', () => {
    for (const [key, meta] of Object.entries(loadRuleMap())) {
      expect(meta.ruleId, key).toMatch(/^code-apps-/);
      expect(['error', 'warning', 'info']).toContain(meta.severity);
      expect(meta.wcagRef).toMatch(/^\d+\.\d+\.\d+$/);
      expect(['A', 'AA', 'AAA']).toContain(meta.wcagLevel);
    }
  });
});
