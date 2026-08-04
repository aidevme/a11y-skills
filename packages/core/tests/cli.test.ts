import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { main } from '../src/cli.js';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const fixture = (name: string): string => join(repoRoot, 'examples', name);

async function run(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const out: string[] = [];
  const err: string[] = [];
  const logSpy = vi.spyOn(console, 'log').mockImplementation((msg) => void out.push(String(msg)));
  const errSpy = vi
    .spyOn(console, 'error')
    .mockImplementation((msg) => void err.push(String(msg)));
  try {
    const code = await main(argv);
    return { code, stdout: out.join('\n'), stderr: err.join('\n') };
  } finally {
    logSpy.mockRestore();
    errSpy.mockRestore();
  }
}

describe('a11y audit CLI', () => {
  it('TC-P1.1-07: empty project → [] and exit 0', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'a11y-empty-'));
    const res = await run(['audit', dir, '--format', 'json']);
    expect(res.code).toBe(0);
    expect(JSON.parse(res.stdout)).toEqual([]);
  });

  it('TC-P1.1-08: seeded fixture fails with --fail-on error', async () => {
    const res = await run(['audit', fixture('react-seeded'), '--format', 'json']);
    expect(res.code).toBe(1);
    expect(JSON.parse(res.stdout).length).toBeGreaterThan(0);
  });

  it('TC-P1.1-09: --fail-on never reports findings but exits 0', async () => {
    const res = await run(['audit', fixture('react-seeded'), '--format', 'json', '--fail-on', 'never']);
    expect(res.code).toBe(0);
    expect(JSON.parse(res.stdout).length).toBeGreaterThan(0);
  });

  it('clean fixture passes with --fail-on error (AC-P1-1)', async () => {
    const res = await run(['audit', fixture('react-clean'), '--format', 'json']);
    expect(res.code).toBe(0);
    expect(JSON.parse(res.stdout)).toEqual([]);
  });

  it('TC-P1.1-11: nonexistent path → exit 2 with message on stderr', async () => {
    const res = await run(['audit', join(tmpdir(), 'a11y-does-not-exist-xyz')]);
    expect(res.code).toBe(2);
    expect(res.stderr).toMatch(/not a directory/);
  });

  it('TC-P1.1-12: malformed config → exit 2', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'a11y-badcfg-'));
    writeFileSync(join(dir, '.a11yrc.json'), '{ nope', 'utf8');
    const res = await run(['audit', dir]);
    expect(res.code).toBe(2);
    expect(res.stderr).toMatch(/invalid JSON/);
  });

  it('TC-P1.1-13: unknown config key → exit 2 naming the key', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'a11y-unkcfg-'));
    writeFileSync(join(dir, '.a11yrc.json'), '{"rulepacks":[]}', 'utf8');
    const res = await run(['audit', dir]);
    expect(res.code).toBe(2);
    expect(res.stderr).toMatch(/rulepacks/);
  });

  it('TC-P1.1-15: --output writes the report to a file, stdout stays clean', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'a11y-out-'));
    const outFile = join(dir, 'report.json');
    const res = await run(['audit', fixture('react-seeded'), '--format', 'json', '--fail-on', 'never', '--output', outFile]);
    expect(res.code).toBe(0);
    expect(res.stdout).toBe('');
    expect(JSON.parse(readFileSync(outFile, 'utf8')).length).toBeGreaterThan(0);
  });

  it('TC-P1.3-11: JSON output is byte-identical across runs (determinism)', async () => {
    const a = await run(['audit', fixture('react-seeded'), '--format', 'json', '--fail-on', 'never']);
    const b = await run(['audit', fixture('react-seeded'), '--format', 'json', '--fail-on', 'never']);
    expect(a.stdout).toBe(b.stdout);
  });

  it('md format renders a verdict header', async () => {
    const res = await run(['audit', fixture('react-seeded'), '--fail-on', 'never']);
    expect(res.stdout).toContain('# Accessibility Audit Report');
    expect(res.stdout).toContain('**Verdict:**');
  });

  it('unknown command → exit 2; help → exit 0', async () => {
    expect((await run(['frobnicate'])).code).toBe(2);
    expect((await run(['--help'])).code).toBe(0);
    expect((await run([])).code).toBe(0);
  });

  it('unknown option → exit 2', async () => {
    expect((await run(['audit', '--frob'])).code).toBe(2);
  });

  it('TC-P5.3-05: a real PCF project audits Layer 1 + Layer 3 findings in one run, correctly surfaced', async () => {
    const res = await run(['audit', fixture('pcf-seeded'), '--format', 'json', '--fail-on', 'never']);
    expect(res.code).toBe(0);
    const findings = JSON.parse(res.stdout) as { ruleId: string; surface: string; layer: number }[];
    expect(findings.length).toBe(10);
    expect(findings.every((f) => f.surface === 'pcf')).toBe(true);
    expect(findings.every((f) => f.layer === 3)).toBe(true);
  });

  it('--files scopes Layer 3 PCF rules to just the given file, regardless of path separator style', async () => {
    const manifestPosix = join(fixture('pcf-seeded'), 'ControlManifest.Input.xml').replace(/\\/g, '/');
    const res = await run(['audit', fixture('pcf-seeded'), '--files', manifestPosix, '--format', 'json', '--fail-on', 'never']);
    const findings = JSON.parse(res.stdout) as { file: string }[];
    expect(findings.length).toBe(5);
    expect(findings.every((f) => f.file === 'ControlManifest.Input.xml')).toBe(true);
  });

  it('TC-P5.1-05 / AC-P5-1: multi-surface monorepo tags each finding with its own subtree surface in one audit', async () => {
    const res = await run(['audit', fixture('surface-monorepo'), '--format', 'json', '--fail-on', 'never']);
    const findings = JSON.parse(res.stdout) as { ruleId: string; surface: string; file: string }[];
    const web = findings.find((f) => f.ruleId === 'react-alt-text');
    const pcf = findings.find((f) => f.ruleId === 'pcf-control-missing-display-name');
    expect(web).toMatchObject({ surface: 'web-app', file: 'apps/web/src/App.tsx' });
    expect(pcf).toMatchObject({ surface: 'pcf', file: 'controls/my-pcf/ControlManifest.Input.xml' });
  });

  it('TC-P6.1-05: a Code Apps project also matching react runs both packs with no duplicate findings', async () => {
    const res = await run(['audit', fixture('code-apps-seeded'), '--format', 'json', '--fail-on', 'never']);
    const findings = JSON.parse(res.stdout) as { ruleId: string; layer: number; surface: string }[];
    expect(findings.map((f) => f.ruleId).sort()).toEqual(
      [
        'code-apps-datagrid-missing-live-region',
        'code-apps-grid-header-missing-sort-state',
        'code-apps-pagination-button-missing-label',
        'react-alt-text',
      ].sort(),
    );
    expect(findings.find((f) => f.ruleId === 'react-alt-text')).toMatchObject({ layer: 1, surface: 'code-apps' });
    expect(findings.every((f) => f.layer === 1 || f.layer === 3)).toBe(true);
    // No duplicate rule ids — every defect is reported exactly once.
    expect(new Set(findings.map((f) => f.ruleId)).size).toBe(findings.length);
  });
});
