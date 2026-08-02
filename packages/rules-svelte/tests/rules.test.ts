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
  const findings = await runRules(listUiFiles(root, ['.svelte']), root);
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

describe('rules-svelte', () => {
  it('TC-P4.1-10 / TC-P4.1-11: seeded fixture yields exactly the expected findings', async () => {
    const expected = JSON.parse(
      readFileSync(join(fixture('svelte-seeded'), 'expected-findings.json'), 'utf8'),
    ) as Expected[];
    expect(await auditFixture('svelte-seeded')).toEqual(expected.sort(byRuleThenLine));
  });

  it('TC-P4.1-10: a11y_missing_attribute is sourced from the compiler, not a custom-implemented rule', async () => {
    const findings = await auditFixture('svelte-seeded');
    const finding = findings.find((f) => f.ruleId === 'svelte-a11y-missing-attribute');
    expect(finding).toBeDefined();
    // AC-P4-2: assert the mapping table has no *custom implementation* for
    // this rule — it exists purely as WCAG metadata for a code the Svelte
    // compiler itself produces, proving we translate rather than reimplement.
    const ruleMap = loadRuleMap();
    expect(ruleMap['a11y_missing_attribute']).toBeDefined();
    expect(ruleMap['a11y_missing_attribute'].ruleId).toBe('svelte-a11y-missing-attribute');
  });

  it('TC-P4.1-11: no-target-blank is emitted via the eslint-plugin-svelte path (not the compiler)', async () => {
    const findings = await auditFixture('svelte-seeded');
    expect(findings.some((f) => f.ruleId === 'svelte-no-target-blank')).toBe(true);
  });

  it('clean fixture yields zero findings (false-positive gate)', async () => {
    expect(await auditFixture('svelte-clean')).toEqual([]);
  });

  it('AC-P4-1: no rule and no finding maps to SC 4.1.1', async () => {
    for (const meta of Object.values(loadRuleMap())) {
      expect(meta.wcagRef).not.toBe('4.1.1');
    }
    const findings = await runRules(
      listUiFiles(fixture('svelte-seeded'), ['.svelte']),
      fixture('svelte-seeded'),
    );
    expect(findings.every((f) => f.wcagRef !== '4.1.1')).toBe(true);
  });

  it('output is deterministic across runs', async () => {
    const a = await auditFixture('svelte-seeded');
    const b = await auditFixture('svelte-seeded');
    expect(a).toEqual(b);
  });

  it('mapping table entries carry complete WCAG metadata', () => {
    for (const [key, meta] of Object.entries(loadRuleMap())) {
      expect(meta.ruleId, key).toMatch(/^svelte-/);
      expect(['error', 'warning', 'info']).toContain(meta.severity);
      expect(meta.wcagRef).toMatch(/^\d+\.\d+\.\d+$/);
      expect(['A', 'AA', 'AAA']).toContain(meta.wcagLevel);
    }
  });
});
