import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getStagedFiles, installPrecommitHook, UI_EXTENSIONS } from '../src/index.js';

function initGitRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'a11y-precommit-'));
  execSync('git init -q', { cwd: dir });
  execSync('git config user.email test@example.com', { cwd: dir });
  execSync('git config user.name Test', { cwd: dir });
  return dir;
}

describe('getStagedFiles', () => {
  it('TC-P3.4: returns absolute paths of staged UI files only', () => {
    const dir = initGitRepo();
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(join(dir, 'src', 'App.tsx'), 'export const x = 1;\n');
    writeFileSync(join(dir, 'README.md'), '# hi\n');
    execSync('git add .', { cwd: dir });

    const staged = getStagedFiles(dir);
    expect(staged).toEqual([join(dir, 'src', 'App.tsx')]);
  });

  it('TC-P3.4-02: unstaged files are never returned', () => {
    const dir = initGitRepo();
    writeFileSync(join(dir, 'App.tsx'), 'export const x = 1;\n');
    // never staged
    expect(getStagedFiles(dir)).toEqual([]);
  });

  it('returns [] outside a git repo', () => {
    const dir = mkdtempSync(join(tmpdir(), 'a11y-nogit-'));
    expect(getStagedFiles(dir)).toEqual([]);
  });

  it('non-UI staged files are excluded', () => {
    const dir = initGitRepo();
    writeFileSync(join(dir, 'README.md'), '# hi\n');
    execSync('git add .', { cwd: dir });
    expect(getStagedFiles(dir)).toEqual([]);
  });

  it('TC-P4.1: staged .svelte files are recognized as UI files', () => {
    expect(UI_EXTENSIONS).toContain('.svelte');
    const dir = initGitRepo();
    writeFileSync(join(dir, 'App.svelte'), '<h1>hi</h1>\n');
    execSync('git add .', { cwd: dir });
    expect(getStagedFiles(dir)).toEqual([join(dir, 'App.svelte')]);
  });
});

describe('installPrecommitHook', () => {
  it('installs an executable hook at .git/hooks/pre-commit', () => {
    const dir = initGitRepo();
    const result = installPrecommitHook(dir);
    expect(result.installed).toBe(true);
    expect(existsSync(result.path)).toBe(true);
    expect(readFileSync(result.path, 'utf8')).toContain('a11y-skills precommit hook');
    if (process.platform !== 'win32') {
      expect(statSync(result.path).mode & 0o111).toBeGreaterThan(0); // executable bit set
    }
  });

  it('is idempotent: installing twice reports already-installed the second time', () => {
    const dir = initGitRepo();
    const first = installPrecommitHook(dir);
    expect(first.installed).toBe(true);
    const second = installPrecommitHook(dir);
    expect(second.installed).toBe(false);
    expect(second.reason).toBe('already-installed');
  });

  it('never clobbers a pre-existing hook it did not install', () => {
    const dir = initGitRepo();
    const hooksDir = join(dir, '.git', 'hooks');
    mkdirSync(hooksDir, { recursive: true });
    const hookPath = join(hooksDir, 'pre-commit');
    writeFileSync(hookPath, '#!/bin/sh\necho "husky or some other tool"\n', 'utf8');

    const result = installPrecommitHook(dir);
    expect(result.installed).toBe(false);
    expect(result.reason).toBe('existing-hook-not-ours');
    expect(readFileSync(hookPath, 'utf8')).toContain('husky or some other tool');
  });

  it('returns not-a-git-repo outside a git repo', () => {
    const dir = mkdtempSync(join(tmpdir(), 'a11y-nogit2-'));
    const result = installPrecommitHook(dir);
    expect(result.installed).toBe(false);
    expect(result.reason).toBe('not-a-git-repo');
  });
});
