import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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

function gitRepoWithSeededFixture(): { dir: string; app: string } {
  const dir = mkdtempSync(join(tmpdir(), 'a11y-precommit-cli-'));
  execSync('git init -q', { cwd: dir });
  execSync('git config user.email test@example.com', { cwd: dir });
  execSync('git config user.name Test', { cwd: dir });
  cpSync(join(repoRoot, 'examples', 'react-seeded'), dir, { recursive: true });
  return { dir, app: join(dir, 'src', 'App.tsx') };
}

describe('a11y precommit CLI (TC-P3.4)', () => {
  it('TC-P3.4-01: staged file with a violation blocks the commit (exit 1)', async () => {
    const { dir } = gitRepoWithSeededFixture();
    execSync('git add .', { cwd: dir });
    const res = await run(['precommit', dir]);
    expect(res.code).toBe(1);
    expect(res.stderr).toMatch(/new error\(s\) in staged files/);
    expect(res.stderr).toContain('src/App.tsx');
  });

  it('TC-P3.4-02: violation exists but the file was never staged → succeeds', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'a11y-precommit-cli-unstaged-'));
    execSync('git init -q', { cwd: dir });
    mkdirSync(join(dir, 'src'), { recursive: true });
    // Not staged.
    writeFileSync(join(dir, 'src', 'App.tsx'), '<img src="x.png" />;\n');
    const res = await run(['precommit', dir]);
    expect(res.code).toBe(0);
    expect(res.stdout).toMatch(/no staged UI files/);
  });

  it('TC-P3.4-03: pre-existing baselined violation in a staged file, no new ones → succeeds (change-scoped)', async () => {
    const { dir, app } = gitRepoWithSeededFixture();
    execSync('git add .', { cwd: dir });
    execSync('git commit -q -m seed', { cwd: dir });
    await run(['baseline', dir]);

    // Re-stage the same, unmodified file — every finding in it is already baselined.
    writeFileSync(app, readFileSync(app, 'utf8'), 'utf8');
    execSync('git add src/App.tsx', { cwd: dir });
    const res = await run(['precommit', dir]);
    expect(res.code).toBe(0);
  });

  it('TC-P3.4-04: completes well within the 5s budget on the fixture repo', async () => {
    const { dir } = gitRepoWithSeededFixture();
    execSync('git add .', { cwd: dir });
    const start = Date.now();
    await run(['precommit', dir]);
    expect(Date.now() - start).toBeLessThan(5000);
  });

  it('outside a git repo, does not crash — reports no staged files', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'a11y-precommit-nogit-'));
    const res = await run(['precommit', dir]);
    expect(res.code).toBe(0);
  });
});
