import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { main } from '../src/cli.js';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));

async function run(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const out: string[] = [];
  const err: string[] = [];
  const logSpy = vi.spyOn(console, 'log').mockImplementation((m) => void out.push(String(m)));
  const errSpy = vi.spyOn(console, 'error').mockImplementation((m) => void err.push(String(m)));
  try {
    const code = await main(argv);
    return { code, stdout: out.join('\n'), stderr: err.join('\n') };
  } finally {
    logSpy.mockRestore();
    errSpy.mockRestore();
  }
}

function seededCopy(): { dir: string; app: string } {
  const dir = mkdtempSync(join(tmpdir(), 'a11y-baseline-'));
  cpSync(join(repoRoot, 'examples', 'react-seeded'), dir, { recursive: true });
  return { dir, app: join(dir, 'src', 'App.tsx') };
}

describe('baseline workflow (TC-P2.5)', () => {
  it('TC-P2.5-01/-05: snapshot records findings but refuses non-interference ones', async () => {
    const { dir } = seededCopy();
    const res = await run(['baseline', dir]);
    expect(res.code).toBe(0);
    expect(res.stdout).toMatch(/8 finding\(s\) recorded/); // 9 total minus the marquee (SC 2.2.2)
    expect(res.stderr).toMatch(/1 non-interference finding\(s\).*NOT baselined/);
    const file = JSON.parse(readFileSync(join(dir, '.a11y-baseline.json'), 'utf8')) as {
      findings: { ruleId: string }[];
    };
    expect(file.findings).toHaveLength(8);
    expect(file.findings.some((f) => f.ruleId === 'react-no-distracting-elements')).toBe(false);
  });

  it('TC-P2.5-05: audit still fails after baselining when NI findings remain', async () => {
    const { dir } = seededCopy();
    await run(['baseline', dir]);
    const res = await run(['audit', dir, '--format', 'json']);
    expect(res.code).toBe(1);
    const findings = JSON.parse(res.stdout) as { ruleId: string; baselined?: boolean }[];
    const failing = findings.filter((f) => !f.baselined);
    expect(failing.map((f) => f.ruleId)).toEqual(['react-no-distracting-elements']);
  });

  it('TC-P2.5-02/-03: gate passes on baselined-only findings; a new violation fails alone', async () => {
    const { dir, app } = seededCopy();
    // Remove the non-interference violation so the fixture is fully baselinable.
    const noMarquee = readFileSync(app, 'utf8').replace(/^.*marquee.*$\n/m, '');
    writeFileSync(app, noMarquee, 'utf8');
    await run(['baseline', dir]);

    const clean = await run(['audit', dir, '--format', 'json']);
    expect(clean.code).toBe(0); // TC-P2.5-02: everything baselined, gate passes

    // Introduce one new violation, anchored on the unique first <img> line so
    // no other finding's line content (and therefore fingerprint) shifts.
    writeFileSync(
      app,
      readFileSync(app, 'utf8').replace(
        '<img src="logo.png" />',
        '<img src="logo.png" />\n      <img src="two.png" />',
      ),
      'utf8',
    );
    const res = await run(['audit', dir, '--format', 'json']);
    expect(res.code).toBe(1);
    const findings = JSON.parse(res.stdout) as {
      ruleId: string;
      baselined?: boolean;
      context?: string;
    }[];
    const failing = findings.filter((f) => !f.baselined);
    expect(failing).toHaveLength(1); // TC-P2.5-03: only the new finding fails
    expect(failing[0].ruleId).toBe('react-alt-text');
    expect(failing[0].context).toContain('two.png');
  });

  it('TC-P2.5-04: --prune only removes fixed entries and never grows', async () => {
    const { dir, app } = seededCopy();
    const noMarquee = readFileSync(app, 'utf8').replace(/^.*marquee.*$\n/m, '');
    writeFileSync(app, noMarquee, 'utf8');
    await run(['baseline', dir]); // 8 entries
    // Fix two findings: the positive-tabindex span (2 findings share that line).
    writeFileSync(app, readFileSync(app, 'utf8').replace(/^.*tabIndex.*$\n/m, ''), 'utf8');
    const res = await run(['baseline', dir, '--prune']);
    expect(res.code).toBe(0);
    expect(res.stdout).toMatch(/pruned: 2 fixed entries removed, 6 remain/);
    // Introduce a new violation and prune again: entry count must not grow.
    // Anchored on the unique <img> line so no existing finding's line content
    // (and therefore fingerprint) shifts as a side effect.
    writeFileSync(
      app,
      readFileSync(app, 'utf8').replace(
        '<img src="logo.png" />',
        '<img src="logo.png" />\n      <img src="three.png" />',
      ),
      'utf8',
    );
    const res2 = await run(['baseline', dir, '--prune']);
    expect(res2.stdout).toMatch(/6 remain/);
  });

  it('prune without an existing baseline is an error', async () => {
    const { dir } = seededCopy();
    const res = await run(['baseline', dir, '--prune']);
    expect(res.code).toBe(2);
    expect(res.stderr).toMatch(/nothing to prune/);
  });
});
