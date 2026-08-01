import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from '../src/config.js';

function tmpProject(config?: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'a11y-config-'));
  if (config !== undefined) writeFileSync(join(dir, '.a11yrc.json'), config, 'utf8');
  return dir;
}

describe('loadConfig', () => {
  it('TC-P1.1-14: missing file yields defaults (standard, 2.2)', () => {
    const cfg = loadConfig(tmpProject());
    expect(cfg.profile).toBe('standard');
    expect(cfg.wcagVersion).toBe('2.2');
    expect(cfg.rulePacks).toEqual([]);
    expect(cfg.overrides).toEqual({});
  });

  it('valid config loads with partial defaults', () => {
    const cfg = loadConfig(tmpProject('{"profile":"mvp","rulePacks":["react"]}'));
    expect(cfg.profile).toBe('mvp');
    expect(cfg.wcagVersion).toBe('2.2');
    expect(cfg.rulePacks).toEqual(['react']);
  });

  it('TC-P1.1-12: malformed JSON throws ConfigError naming the file', () => {
    const dir = tmpProject('{ not json');
    expect(() => loadConfig(dir)).toThrowError(ConfigError);
    expect(() => loadConfig(dir)).toThrowError(/\.a11yrc\.json/);
  });

  it('TC-P1.1-13: unknown top-level key throws ConfigError naming the key', () => {
    const dir = tmpProject('{"rulepacks":[]}');
    expect(() => loadConfig(dir)).toThrowError(ConfigError);
    expect(() => loadConfig(dir)).toThrowError(/rulepacks/);
  });

  it('invalid enum value is rejected', () => {
    expect(() => loadConfig(tmpProject('{"profile":"lenient"}'))).toThrowError(ConfigError);
  });
});
