import { describe, expect, it } from 'vitest';
import type { A11yConfig } from '../src/config.js';
import { enrich, type RawFinding } from '../src/finding.js';
import { applyProfile } from '../src/profiles.js';

function cfg(over: Partial<A11yConfig>): A11yConfig {
  return { rulePacks: [], profile: 'standard', wcagVersion: '2.2', overrides: {}, ...over };
}

function raw(over: Partial<RawFinding>): RawFinding {
  return {
    ruleId: 'r1',
    severity: 'error',
    wcagRef: '4.1.2',
    wcagLevel: 'A',
    wcagVersion: '2.0',
    message: 'm',
    file: 'a.tsx',
    layer: 1,
    category: 'semantic',
    context: 'ctx',
    ...over,
  };
}

function sev(rawOver: Partial<RawFinding>, cfgOver: Partial<A11yConfig>): string | undefined {
  const out = applyProfile(enrich([raw(rawOver)], 'web-app'), cfg(cfgOver));
  return out[0]?.severity;
}

describe('compliance profiles (TC-P2.4)', () => {
  it.each([
    ['strict', { wcagLevel: 'AAA' as const }, 'error'], // TC-P2.4-01
    ['standard', { wcagLevel: 'AAA' as const }, 'warning'], // TC-P2.4-02
    ['standard', { wcagLevel: 'AA' as const }, 'error'], // TC-P2.4-03
    ['mvp', { wcagLevel: 'AA' as const, category: 'visual' }, 'warning'], // TC-P2.4-04
    ['mvp', { wcagLevel: 'A' as const, category: 'semantic' }, 'error'], // TC-P2.4-05
  ] as const)('profile %s maps %o to %s', (profile, rawOver, expected) => {
    expect(sev(rawOver, { profile })).toBe(expected);
  });

  it('TC-P2.4-06: non-interference rules are errors under every profile', () => {
    for (const profile of ['strict', 'standard', 'mvp'] as const) {
      expect(sev({ wcagRef: '2.1.2', severity: 'warning' }, { profile })).toBe('error');
    }
  });

  it('TC-P2.4-07: relaxing overrides are ignored for non-interference rules', () => {
    expect(sev({ wcagRef: '2.1.2', ruleId: 'trap' }, { overrides: { trap: 'off' } })).toBe('error');
    expect(sev({ wcagRef: '2.1.2', ruleId: 'trap' }, { overrides: { trap: 'info' } })).toBe('error');
  });

  it('TC-P2.4-08: rules newer than configured wcagVersion are excluded', () => {
    expect(sev({ wcagVersion: '2.2' }, { wcagVersion: '2.1' })).toBeUndefined();
  });

  it('TC-P2.4-09: rules at or below configured version are included', () => {
    expect(sev({ wcagVersion: '2.0' }, { wcagVersion: '2.0' })).toBe('error');
    expect(sev({ wcagVersion: '2.1' }, { wcagVersion: '2.2' })).toBe('error');
  });

  it('overrides apply to normal rules, including off', () => {
    expect(sev({ ruleId: 'x' }, { overrides: { x: 'info' } })).toBe('info');
    expect(sev({ ruleId: 'x' }, { overrides: { x: 'off' } })).toBeUndefined();
  });

  it('baseSeverity is preserved while severity is remapped', () => {
    const out = applyProfile(
      enrich([raw({ wcagLevel: 'AAA', severity: 'error' })], 'web-app'),
      cfg({ profile: 'standard' }),
    );
    expect(out[0].baseSeverity).toBe('error');
    expect(out[0].severity).toBe('warning');
  });
});
