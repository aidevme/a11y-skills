import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runInit, type FrameworkDetection, type RunInitOptions } from '../src/index.js';

const REACT_FLUENT: FrameworkDetection = { frameworks: ['react'], fluent: true };
const REACT_ONLY: FrameworkDetection = { frameworks: ['react'], fluent: false };
const VUE_ONLY: FrameworkDetection = { frameworks: ['vue'], fluent: false };
const STATIC_HTML_ONLY: FrameworkDetection = { frameworks: ['static-html'], fluent: false };
const NONE: FrameworkDetection = { frameworks: [], fluent: false };
const STANDARD: RunInitOptions = { profile: 'standard', withPrecommit: false, withHooks: false };

function tmpProject(files: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), 'a11y-init-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content, 'utf8');
  }
  return dir;
}

function snapshotDir(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (d: string, prefix: string): void => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(join(d, entry.name), rel);
      else out[rel] = readFileSync(join(d, entry.name), 'utf8');
    }
  };
  walk(dir, '');
  return out;
}

describe('a11y init (context-gen)', () => {
  it('TC-P1.8-01: creates A11Y.md + .a11yrc.json and wires existing hosts', async () => {
    const dir = tmpProject({ '.cursorrules': 'be nice\n', 'CLAUDE.md': '# Project\n' });
    const result = await runInit(dir, REACT_ONLY, STANDARD);
    expect(result.created.sort()).toEqual(['.a11yrc.json', 'A11Y.md']);
    expect(result.updated.sort()).toEqual(['.cursorrules', 'CLAUDE.md']);
    expect(readFileSync(join(dir, 'CLAUDE.md'), 'utf8')).toContain('A11Y.md');
    expect(readFileSync(join(dir, '.cursorrules'), 'utf8')).toContain('A11Y.md');
  });

  it('TC-P1.8-02 / AC-P1-5 / TC-P3.3-01: second run changes zero bytes', async () => {
    const dir = tmpProject({ '.cursorrules': 'rules\n', 'CLAUDE.md': '# P\n' });
    await runInit(dir, REACT_FLUENT, STANDARD);
    const before = snapshotDir(dir);
    const second = await runInit(dir, REACT_FLUENT, STANDARD);
    expect(snapshotDir(dir)).toEqual(before);
    expect(second.created).toEqual([]);
    expect(second.updated).toEqual([]);
  });

  it('TC-P1.8-03: no host files → creates core files only, invents nothing', async () => {
    const dir = tmpProject();
    const result = await runInit(dir, NONE, STANDARD);
    expect(result.created.sort()).toEqual(['.a11yrc.json', 'A11Y.md']);
    expect(result.updated).toEqual([]);
    expect(existsSync(join(dir, 'CLAUDE.md'))).toBe(false);
    expect(existsSync(join(dir, '.cursorrules'))).toBe(false);
  });

  it('TC-P1.8-04: AGENTS.md and copilot-instructions.md get identical pointers', async () => {
    const dir = tmpProject({
      'AGENTS.md': '# Agents\n',
      '.github/copilot-instructions.md': '# Copilot\n',
    });
    await runInit(dir, REACT_ONLY, STANDARD);
    const agents = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
    const copilot = readFileSync(join(dir, '.github/copilot-instructions.md'), 'utf8');
    const pointerLine = agents.split('\n').find((l) => l.includes('A11Y.md'));
    expect(pointerLine).toBeDefined();
    expect(copilot).toContain(pointerLine as string);
  });

  it('TC-P1.8-05: existing .a11yrc.json is never overwritten', async () => {
    const custom = '{"profile":"mvp"}\n';
    const dir = tmpProject({ '.a11yrc.json': custom });
    const result = await runInit(dir, REACT_ONLY, STANDARD);
    expect(readFileSync(join(dir, '.a11yrc.json'), 'utf8')).toBe(custom);
    expect(result.unchanged).toContain('.a11yrc.json');
  });

  it('TC-P1.8-06: pointer already present mid-file is not duplicated', async () => {
    const dir = tmpProject({ 'CLAUDE.md': '# P\nSee A11Y.md for accessibility.\nMore.\n' });
    await runInit(dir, REACT_ONLY, STANDARD);
    const content = readFileSync(join(dir, 'CLAUDE.md'), 'utf8');
    expect(content.match(/A11Y\.md/g)).toHaveLength(1);
  });

  it('TC-P1.8-07 / AC-P3-3: fluent detection controls the Fluent section; PCF/Pages never appear', async () => {
    const fluentDir = tmpProject();
    await runInit(fluentDir, REACT_FLUENT, STANDARD);
    const withFluent = readFileSync(join(fluentDir, 'A11Y.md'), 'utf8');
    expect(withFluent).toContain('## Fluent UI v9');
    expect(withFluent).toContain('## React');
    expect(withFluent).not.toMatch(/PCF|Power Pages/);

    const plainDir = tmpProject();
    await runInit(plainDir, REACT_ONLY, STANDARD);
    const noFluent = readFileSync(join(plainDir, 'A11Y.md'), 'utf8');
    expect(noFluent).toContain('## React');
    expect(noFluent).not.toContain('## Fluent UI v9');
  });

  it('TC-P3.3: Vue detection generates a metadata-driven Vue section', async () => {
    const dir = tmpProject();
    await runInit(dir, VUE_ONLY, STANDARD);
    const content = readFileSync(join(dir, 'A11Y.md'), 'utf8');
    expect(content).toContain('## Vue');
    expect(content).toMatch(/`vue-alt-text`/);
    expect(content).not.toContain('## React');
  });

  it('TC-P4.1: Angular detection generates a metadata-driven Angular section', async () => {
    const dir = tmpProject();
    await runInit(dir, { frameworks: ['angular'], fluent: false }, STANDARD);
    const content = readFileSync(join(dir, 'A11Y.md'), 'utf8');
    expect(content).toContain('## Angular');
    expect(content).toMatch(/`angular-alt-text`/);
  });

  it('TC-P4.1: Svelte detection generates a metadata-driven Svelte section', async () => {
    const dir = tmpProject();
    await runInit(dir, { frameworks: ['svelte'], fluent: false }, STANDARD);
    const content = readFileSync(join(dir, 'A11Y.md'), 'utf8');
    expect(content).toContain('## Svelte');
    expect(content).toMatch(/`svelte-no-target-blank`/);
  });

  it('TC-P3.3: static-html detection generates a metadata-driven Static HTML section', async () => {
    const dir = tmpProject();
    await runInit(dir, STATIC_HTML_ONLY, STANDARD);
    const content = readFileSync(join(dir, 'A11Y.md'), 'utf8');
    expect(content).toContain('## Static HTML');
    expect(content).toMatch(/`html-img-alt`/);
  });

  it('TC-P3.3-02: generated section content matches the pack rules-map.json exactly (metadata-driven, not hand-typed)', async () => {
    const dir = tmpProject();
    await runInit(dir, VUE_ONLY, STANDARD);
    const content = readFileSync(join(dir, 'A11Y.md'), 'utf8');
    const ruleMap = JSON.parse(
      readFileSync(new URL('../../rules-vue/rules-map.json', import.meta.url), 'utf8'),
    ) as Record<string, { ruleId: string; wcagRef: string; summary: string }>;
    for (const meta of Object.values(ruleMap)) {
      expect(content).toContain(`- ${meta.summary} (\`${meta.ruleId}\`, SC ${meta.wcagRef}).`);
    }
  });

  it('TC-P3.3-04: switching profile changes only the compliance-target wording', async () => {
    const standardDir = tmpProject();
    await runInit(standardDir, REACT_ONLY, { profile: 'standard', withPrecommit: false, withHooks: false });
    const standard = readFileSync(join(standardDir, 'A11Y.md'), 'utf8');
    expect(standard).toContain('Profile: **standard**');

    const mvpDir = tmpProject();
    await runInit(mvpDir, REACT_ONLY, { profile: 'mvp', withPrecommit: false, withHooks: false });
    const mvp = readFileSync(join(mvpDir, 'A11Y.md'), 'utf8');
    expect(mvp).toContain('Profile: **mvp**');
    expect(mvp).toContain('semantic structure rules never relax');

    // Only the "## Compliance target" bullet differs — everything else is identical.
    const stripProfileLine = (s: string): string =>
      s
        .split('\n')
        .filter((l) => !l.startsWith('- Profile:'))
        .join('\n');
    expect(stripProfileLine(standard)).toBe(stripProfileLine(mvp));
  });

  it('regenerates the marked block but preserves user content around it', async () => {
    const dir = tmpProject();
    await runInit(dir, REACT_ONLY, STANDARD);
    const path = join(dir, 'A11Y.md');
    const withUserContent = `${readFileSync(path, 'utf8')}\n## Team notes\n\nOur own rules.\n`;
    writeFileSync(path, withUserContent, 'utf8');
    await runInit(dir, REACT_FLUENT, STANDARD); // detection changed → block regenerates
    const after = readFileSync(path, 'utf8');
    expect(after).toContain('## Team notes');
    expect(after).toContain('## Fluent UI v9');
  });

  describe('--with-precommit', () => {
    function initGitRepo(): string {
      const dir = mkdtempSync(join(tmpdir(), 'a11y-init-git-'));
      execSync('git init -q', { cwd: dir });
      return dir;
    }

    it('TC-P3.4: installs the git pre-commit hook when requested', async () => {
      const dir = initGitRepo();
      const result = await runInit(dir, REACT_ONLY, { profile: 'standard', withPrecommit: true, withHooks: false });
      expect(result.updated).toContain('.git/hooks/pre-commit');
      expect(existsSync(join(dir, '.git', 'hooks', 'pre-commit'))).toBe(true);
    });

    it('does not install a hook when --with-precommit is not set', async () => {
      const dir = initGitRepo();
      await runInit(dir, REACT_ONLY, STANDARD);
      expect(existsSync(join(dir, '.git', 'hooks', 'pre-commit'))).toBe(false);
    });

    it('is idempotent: second run with --with-precommit reports unchanged', async () => {
      const dir = initGitRepo();
      await runInit(dir, REACT_ONLY, { profile: 'standard', withPrecommit: true, withHooks: false });
      const second = await runInit(dir, REACT_ONLY, { profile: 'standard', withPrecommit: true, withHooks: false });
      expect(second.updated).not.toContain('.git/hooks/pre-commit');
    });

    it('outside a git repo, reports the skip reason instead of throwing', async () => {
      const dir = tmpProject();
      const result = await runInit(dir, REACT_ONLY, { profile: 'standard', withPrecommit: true, withHooks: false });
      expect(result.unchanged.some((u) => u.includes('not a git repo'))).toBe(true);
    });
  });

  describe('--with-hooks', () => {
    const WITH_HOOKS: RunInitOptions = { profile: 'standard', withPrecommit: false, withHooks: true };

    it('TC-P4.2: sets hooksEnabled: true in a freshly created .a11yrc.json', async () => {
      const dir = tmpProject();
      const result = await runInit(dir, REACT_ONLY, WITH_HOOKS);
      expect(result.created).toContain('.a11yrc.json');
      const config = JSON.parse(readFileSync(join(dir, '.a11yrc.json'), 'utf8'));
      expect(config.hooksEnabled).toBe(true);
    });

    it('does not set hooksEnabled when --with-hooks is not requested', async () => {
      const dir = tmpProject();
      await runInit(dir, REACT_ONLY, STANDARD);
      const config = JSON.parse(readFileSync(join(dir, '.a11yrc.json'), 'utf8'));
      expect(config.hooksEnabled).toBeUndefined();
    });

    it('TC-P4.2: merge-patches hooksEnabled: true into an existing .a11yrc.json, preserving other fields', async () => {
      const custom = '{\n  "profile": "mvp",\n  "rulePacks": ["react"]\n}\n';
      const dir = tmpProject({ '.a11yrc.json': custom });
      const result = await runInit(dir, REACT_ONLY, WITH_HOOKS);
      expect(result.updated).toContain('.a11yrc.json');
      const config = JSON.parse(readFileSync(join(dir, '.a11yrc.json'), 'utf8'));
      expect(config.hooksEnabled).toBe(true);
      expect(config.profile).toBe('mvp');
      expect(config.rulePacks).toEqual(['react']);
    });

    it('is idempotent: second run with --with-hooks reports unchanged', async () => {
      const dir = tmpProject();
      await runInit(dir, REACT_ONLY, WITH_HOOKS);
      const second = await runInit(dir, REACT_ONLY, WITH_HOOKS);
      expect(second.unchanged).toContain('.a11yrc.json');
      expect(second.updated).not.toContain('.a11yrc.json');
    });

    it('without --with-hooks, an existing .a11yrc.json is still never overwritten', async () => {
      const custom = '{"profile":"mvp"}\n';
      const dir = tmpProject({ '.a11yrc.json': custom });
      const result = await runInit(dir, REACT_ONLY, STANDARD);
      expect(readFileSync(join(dir, '.a11yrc.json'), 'utf8')).toBe(custom);
      expect(result.unchanged).toContain('.a11yrc.json');
    });
  });
});
