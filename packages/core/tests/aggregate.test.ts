import { describe, expect, it } from 'vitest';
import { aggregate } from '../src/aggregate.js';
import { enrich, type RawFinding } from '../src/finding.js';

function raw(overrides: Partial<RawFinding>): RawFinding {
  return {
    ruleId: 'r',
    severity: 'error',
    wcagRef: '1.1.1',
    wcagLevel: 'A',
    wcagVersion: '2.0',
    message: 'm',
    file: 'a.tsx',
    layer: 1,
    context: 'ctx',
    ...overrides,
  };
}

describe('aggregate', () => {
  it('TC-P1.1-05: dedupes identical fingerprints across layers, first wins', () => {
    const findings = enrich(
      [raw({ layer: 1 }), raw({ layer: 2 })].map((f) => ({ ...f })),
      'web-app',
    );
    const out = aggregate(findings);
    expect(out).toHaveLength(1);
    expect(out[0].layer).toBe(1);
  });

  it('TC-P1.1-06: sorts severity → wcagRef (numeric) → file → line', () => {
    const findings = enrich(
      [
        raw({ ruleId: 'w1', severity: 'warning', wcagRef: '2.4.3', file: 'b.tsx' }),
        raw({ ruleId: 'e2', severity: 'error', wcagRef: '4.1.2', file: 'a.tsx' }),
        raw({ ruleId: 'e1', severity: 'error', wcagRef: '1.1.1', file: 'z.tsx' }),
        raw({ ruleId: 'i1', severity: 'info', wcagRef: '1.1.1', file: 'a.tsx' }),
        raw({ ruleId: 'e3', severity: 'error', wcagRef: '4.1.2', file: 'b.tsx' }),
      ],
      'web-app',
    );
    const out = aggregate(findings).map((f) => f.ruleId);
    expect(out).toEqual(['e1', 'e2', 'e3', 'w1', 'i1']);
  });

  it('numeric wcagRef ordering: 1.4.10 sorts after 1.4.2', () => {
    const findings = enrich(
      [raw({ ruleId: 'later', wcagRef: '1.4.10' }), raw({ ruleId: 'earlier', wcagRef: '1.4.2' })],
      'web-app',
    );
    expect(aggregate(findings).map((f) => f.ruleId)).toEqual(['earlier', 'later']);
  });
});
