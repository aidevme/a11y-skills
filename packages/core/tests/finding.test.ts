import { describe, expect, it } from 'vitest';
import { enrich, fingerprintOf, type RawFinding } from '../src/finding.js';

const base: RawFinding = {
  ruleId: 'react-alt-text',
  severity: 'error',
  wcagRef: '1.1.1',
  wcagLevel: 'A',
  wcagVersion: '2.0',
  message: 'img has no alt',
  file: 'src/App.tsx',
  range: { startLine: 4, startCol: 7 },
  layer: 1,
  context: '<img src="x.png" />',
};

describe('fingerprint', () => {
  it('TC-P1.1-01: ignores line-number drift (same rule+file+context)', () => {
    const a = enrich([{ ...base, range: { startLine: 4, startCol: 7 } }], 'web-app')[0];
    const b = enrich([{ ...base, range: { startLine: 40, startCol: 1 } }], 'web-app')[0];
    expect(a.fingerprint).toBe(b.fingerprint);
  });

  it('TC-P1.1-02: differs when ruleId or file differs', () => {
    expect(fingerprintOf('rule-a', 'f.tsx', 'ctx')).not.toBe(fingerprintOf('rule-b', 'f.tsx', 'ctx'));
    expect(fingerprintOf('rule-a', 'f.tsx', 'ctx')).not.toBe(fingerprintOf('rule-a', 'g.tsx', 'ctx'));
  });
});

describe('nonInterference derivation', () => {
  it('TC-P1.1-03/04: true for exactly the four WCAG 5.2.5 criteria', () => {
    for (const ref of ['1.4.2', '2.1.2', '2.2.2', '2.3.1']) {
      expect(enrich([{ ...base, wcagRef: ref }], 'web-app')[0].nonInterference).toBe(true);
    }
    for (const ref of ['1.1.1', '4.1.2', '2.4.3']) {
      expect(enrich([{ ...base, wcagRef: ref }], 'web-app')[0].nonInterference).toBe(false);
    }
  });

  it('enrich sets baseSeverity and surface', () => {
    const f = enrich([base], 'web-app')[0];
    expect(f.baseSeverity).toBe('error');
    expect(f.surface).toBe('web-app');
  });
});
