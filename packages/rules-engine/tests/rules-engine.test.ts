import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  RuleEngineError,
  evaluateRules,
  loadRuleFile,
  substitute,
  type ConditionEvaluator,
  type RuleDefinition,
} from '../src/index.js';

function tmpRuleFile(rules: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), 'a11y-rules-'));
  const path = join(dir, 'rules.json');
  writeFileSync(path, JSON.stringify(rules), 'utf8');
  return path;
}

const BASE_RULE: RuleDefinition = {
  ruleId: 'pcf-missing-aria-label',
  target: 'ControlManifest.xml',
  severity: 'error',
  wcagRef: '4.1.2',
  wcagLevel: 'A',
  wcagVersion: '2.0',
  surface: 'pcf',
  condition: { type: 'control-property', check: 'no-associated-label' },
  message: "PCF control '{{name}}' exposes no accessible name for assistive tech.",
};

/** Trivial evaluator used across tests: fires once per test, echoing back whatever placeholders/line the condition specifies. */
const stubEvaluators: Record<string, ConditionEvaluator> = {
  'control-property': (_content, condition) => [
    { placeholders: (condition.placeholders as Record<string, string>) ?? {}, line: (condition.line as number) ?? 1 },
  ],
  'attribute-present': () => [],
  'attribute-value': () => [],
};

describe('substitute (AC-P5-2 placeholder safety)', () => {
  it('TC-P5.2-01: substitutes {{placeholder}} tokens', () => {
    expect(substitute('Control {{name}} is bad', { name: 'RatingControl' })).toBe('Control RatingControl is bad');
  });

  it('TC-P5.2-02: a placeholder value containing {{ or markdown is rendered literally, never re-interpolated', () => {
    const out = substitute('Value: {{value}}', { value: '{{name}} and **bold**' });
    expect(out).toBe('Value: {{name}} and **bold**');
  });

  it('leaves unknown {{tokens}} untouched rather than substituting undefined', () => {
    expect(substitute('{{known}} / {{unknown}}', { known: 'x' })).toBe('x / {{unknown}}');
  });
});

describe('loadRuleFile', () => {
  it('loads a well-formed rule file', () => {
    const path = tmpRuleFile([BASE_RULE]);
    expect(loadRuleFile(path, stubEvaluators)).toEqual([BASE_RULE]);
  });

  it('TC-P5.2-04: malformed rule JSON throws RuleEngineError naming the file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'a11y-rules-'));
    const path = join(dir, 'rules.json');
    writeFileSync(path, '{ not valid json', 'utf8');
    expect(() => loadRuleFile(path, stubEvaluators)).toThrow(RuleEngineError);
    expect(() => loadRuleFile(path, stubEvaluators)).toThrow(path);
  });

  it('a rule missing a required field throws, naming the field', () => {
    const path = tmpRuleFile([{ ...BASE_RULE, wcagRef: undefined }]);
    expect(() => loadRuleFile(path, stubEvaluators)).toThrow(/wcagRef/);
  });

  it('TC-P5.2-05: an unknown condition type throws a load-time error naming the rule', () => {
    const path = tmpRuleFile([{ ...BASE_RULE, condition: { type: 'no-such-type' } }]);
    expect(() => loadRuleFile(path, stubEvaluators)).toThrow(/pcf-missing-aria-label/);
    expect(() => loadRuleFile(path, stubEvaluators)).toThrow(/no-such-type/);
  });
});

describe('evaluateRules', () => {
  it('TC-P5.2-01: a firing condition produces a finding with substituted placeholders', () => {
    const rule: RuleDefinition = {
      ...BASE_RULE,
      condition: { type: 'control-property', check: 'no-associated-label', placeholders: { name: 'RatingControl' }, line: 3 },
    };
    const findings = evaluateRules(
      [rule],
      'pcf',
      [{ relPath: 'ControlManifest.xml', content: '<manifest/>' }],
      stubEvaluators,
    );
    expect(findings).toEqual([
      {
        ruleId: 'pcf-missing-aria-label',
        severity: 'error',
        wcagRef: '4.1.2',
        wcagLevel: 'A',
        wcagVersion: '2.0',
        message: "PCF control 'RatingControl' exposes no accessible name for assistive tech.",
        file: 'ControlManifest.xml',
        range: { startLine: 3, startCol: 1 },
        layer: 3,
        category: undefined,
        context: undefined,
      },
    ]);
  });

  it('TC-P5.2-03: a rule for a different surface never fires', () => {
    const rule: RuleDefinition = { ...BASE_RULE, surface: 'power-pages' };
    const findings = evaluateRules(
      [rule],
      'pcf',
      [{ relPath: 'ControlManifest.xml', content: '<manifest/>' }],
      stubEvaluators,
    );
    expect(findings).toEqual([]);
  });

  it('a rule never fires against a file that does not match its target', () => {
    const findings = evaluateRules(
      [BASE_RULE],
      'pcf',
      [{ relPath: 'unrelated.json', content: '{}' }],
      stubEvaluators,
    );
    expect(findings).toEqual([]);
  });

  it('rules from two surfaces loaded simultaneously do not cross-fire (AC-P5-2)', () => {
    const pcfRule: RuleDefinition = { ...BASE_RULE, ruleId: 'pcf-rule' };
    const pagesRule: RuleDefinition = { ...BASE_RULE, ruleId: 'pages-rule', surface: 'power-pages', target: 'x.html' };
    const files = [
      { relPath: 'ControlManifest.xml', content: '' },
      { relPath: 'x.html', content: '' },
    ];
    const pcfFindings = evaluateRules([pcfRule, pagesRule], 'pcf', files, stubEvaluators);
    expect(pcfFindings.map((f) => f.ruleId)).toEqual(['pcf-rule']);

    const pagesFindings = evaluateRules([pcfRule, pagesRule], 'power-pages', files, stubEvaluators);
    expect(pagesFindings.map((f) => f.ruleId)).toEqual(['pages-rule']);
  });

  it('an unregistered condition type at evaluation time throws RuleEngineError', () => {
    const rule: RuleDefinition = { ...BASE_RULE, condition: { type: 'mystery' } };
    expect(() =>
      evaluateRules([rule], 'pcf', [{ relPath: 'ControlManifest.xml', content: '' }], stubEvaluators),
    ).toThrow(RuleEngineError);
  });
});
