import { describe, expect, it } from 'vitest';
import type { Finding } from '@aidevme/a11y';
import { renderSarif } from '../src/index.js';

const meta = { profile: 'standard', wcagVersion: '2.2', failOn: 'error' };

function finding(over: Partial<Finding>): Finding {
  return {
    ruleId: 'react-alt-text',
    severity: 'error',
    baseSeverity: 'error',
    wcagRef: '1.1.1',
    wcagLevel: 'A',
    wcagVersion: '2.0',
    message: 'img elements must have an alt prop',
    file: 'src/App.tsx',
    range: { startLine: 4, startCol: 7 },
    layer: 1,
    surface: 'web-app',
    nonInterference: false,
    fingerprint: 'abc123',
    ...over,
  } as Finding;
}

describe('SARIF reporter (TC-P2.1)', () => {
  it('TC-P2.1-01: valid SARIF 2.1.0 with rules, helpUri, and our fingerprint', () => {
    const sarif = JSON.parse(renderSarif({ findings: [finding({})], meta }));
    expect(sarif.version).toBe('2.1.0');
    const run = sarif.runs[0];
    expect(run.tool.driver.name).toBe('@aidevme/a11y');
    expect(run.tool.driver.rules[0].helpUri).toBe(
      'https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html',
    );
    const result = run.results[0];
    expect(result.ruleId).toBe('react-alt-text');
    expect(result.level).toBe('error');
    expect(result.partialFingerprints['a11yFingerprint/v1']).toBe('abc123');
    expect(result.locations[0].physicalLocation.region.startLine).toBe(4);
  });

  it('TC-P2.1-04: zero findings still yields valid SARIF with empty results', () => {
    const sarif = JSON.parse(renderSarif({ findings: [], meta }));
    expect(sarif.runs[0].results).toEqual([]);
    expect(sarif.runs[0].tool.driver.rules).toEqual([]);
  });

  it('TC-P2.1-05: finding without range omits region, stays file-level', () => {
    const sarif = JSON.parse(renderSarif({ findings: [finding({ range: undefined })], meta }));
    const loc = sarif.runs[0].results[0].locations[0].physicalLocation;
    expect(loc.artifactLocation.uri).toBe('src/App.tsx');
    expect(loc.region).toBeUndefined();
  });

  it('baselined findings carry a suppression', () => {
    const sarif = JSON.parse(renderSarif({ findings: [finding({ baselined: true })], meta }));
    expect(sarif.runs[0].results[0].suppressions[0].kind).toBe('external');
    const active = JSON.parse(renderSarif({ findings: [finding({})], meta }));
    expect(active.runs[0].results[0].suppressions).toBeUndefined();
  });

  it('severity mapping: info → note; rules deduped across findings', () => {
    const sarif = JSON.parse(
      renderSarif({
        findings: [finding({}), finding({ severity: 'info', fingerprint: 'x2' })],
        meta,
      }),
    );
    expect(sarif.runs[0].results[1].level).toBe('note');
    expect(sarif.runs[0].tool.driver.rules).toHaveLength(1);
  });

  it('golden snapshot', () => {
    expect(renderSarif({ findings: [finding({})], meta })).toMatchSnapshot();
  });
});
