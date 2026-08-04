import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { listUiFiles } from '../../core/src/files.js';
import { loadRuleMap, runRules } from '../src/index.js';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const fixture = (name: string): string => join(repoRoot, 'examples', name);
const EXTENSIONS = ['ControlManifest.Input.xml', '.form.xml'];

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

describe('rules-pcf', () => {
  it('TC-P5.3-01..04: seeded fixture (manifest + form XML) yields exactly the expected findings', async () => {
    const expected = JSON.parse(
      readFileSync(join(fixture('pcf-seeded'), 'expected-findings.json'), 'utf8'),
    ) as Expected[];
    expect(await auditFixture('pcf-seeded')).toEqual(expected.sort(byRuleThenLine));
  });

  it('TC-P5.3-04: compliant manifest + form XML yields zero findings (false-positive gate)', async () => {
    expect(await auditFixture('pcf-clean')).toEqual([]);
  });

  it('TC-P5.3-01: bound property lacking display-name-key fires pcf-property-missing-display-name at error/4.1.2', async () => {
    const findings = await auditFixture('pcf-seeded');
    const finding = findings.find((f) => f.ruleId === 'pcf-property-missing-display-name');
    expect(finding).toMatchObject({ severity: 'error', wcagRef: '4.1.2' });
  });

  it('TC-P5.3-02: a standard (non-virtual) control is flagged for manual keyboard review at 2.1.1', async () => {
    const findings = await auditFixture('pcf-seeded');
    const finding = findings.find((f) => f.ruleId === 'pcf-standard-control-manual-keyboard-review');
    expect(finding).toMatchObject({ severity: 'warning', wcagRef: '2.1.1' });
  });

  it('TC-P5.3-03: an unlabeled Dataverse form field fires a 3.3.2 rule', async () => {
    const findings = await auditFixture('pcf-seeded');
    const ids = findings.filter((f) => f.wcagRef === '3.3.2').map((f) => f.ruleId);
    expect(ids).toEqual(expect.arrayContaining(['dataverse-cell-label-empty', 'dataverse-cell-label-hidden']));
  });

  it('AC-P5-1: no rule and no finding maps to SC 4.1.1', async () => {
    for (const meta of Object.values(loadRuleMap())) {
      expect(meta.wcagRef).not.toBe('4.1.1');
    }
    const findings = await runRules(listUiFiles(fixture('pcf-seeded'), EXTENSIONS), fixture('pcf-seeded'));
    expect(findings.every((f) => f.wcagRef !== '4.1.1')).toBe(true);
  });

  it('every finding carries layer 3 (domain rule engine)', async () => {
    const findings = await runRules(listUiFiles(fixture('pcf-seeded'), EXTENSIONS), fixture('pcf-seeded'));
    expect(findings.every((f) => f.layer === 3)).toBe(true);
  });

  it('output is deterministic across runs', async () => {
    const a = await auditFixture('pcf-seeded');
    const b = await auditFixture('pcf-seeded');
    expect(a).toEqual(b);
  });

  it('mapping table entries carry complete WCAG metadata', () => {
    for (const [key, meta] of Object.entries(loadRuleMap())) {
      expect(meta.ruleId, key).toMatch(/^(pcf|dataverse)-/);
      expect(['error', 'warning', 'info']).toContain(meta.severity);
      expect(meta.wcagRef).toMatch(/^\d+\.\d+\.\d+$/);
      expect(['A', 'AA', 'AAA']).toContain(meta.wcagLevel);
    }
  });
});
